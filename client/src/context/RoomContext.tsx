import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { usePostHog } from '@posthog/react';
import { useSocket } from '../hooks/useSocket';
import type { VideoPlatform } from '@/types/video';

const STORAGE_KEY = 'watchparty-room';

interface StoredRoomData {
  roomCode: string;
  username: string;
}

interface Participant {
  id: string;
  username: string;
  isHost: boolean;
}

interface RoomState {
  roomCode: string | null;
  videoId: string | null;
  platform: VideoPlatform | null;
  isHost: boolean;
  participants: Participant[];
  isConnected: boolean;
  error: string | null;
  initialTime: number;
  initialPlaying: boolean;
}

interface RoomContextValue extends RoomState {
  createRoom: (videoUrl: string, username: string) => void;
  joinRoom: (roomCode: string, username: string) => void;
  leaveRoom: () => void;
  syncTime: (currentTime: number) => void;
  emitPlay: () => void;
  emitPause: () => void;
  onSyncUpdate: (callback: (currentTime: number) => void) => () => void;
  onPlayVideo: (callback: () => void) => () => void;
  onPauseVideo: (callback: () => void) => () => void;
  clearError: () => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

function saveRoomToStorage(roomCode: string, username: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomCode, username }));
}

function getRoomFromStorage(): StoredRoomData | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

function clearRoomStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const posthog = usePostHog();
  const { emit, on } = useSocket();
  const hasAttemptedRejoin = useRef(false);
  const pendingUsername = useRef<string | null>(null);
  const pendingRoomCode = useRef<string | null>(null);
  const [state, setState] = useState<RoomState>({
    roomCode: null,
    videoId: null,
    platform: null,
    isHost: false,
    participants: [],
    isConnected: false,
    error: null,
    initialTime: 0,
    initialPlaying: false
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      on('room-created', (data: unknown) => {
        const { roomCode, videoId, platform } = data as { roomCode: string; videoId: string; platform: VideoPlatform };
        if (pendingUsername.current) {
          saveRoomToStorage(roomCode, pendingUsername.current);
          pendingUsername.current = null;
        }
        posthog.capture('room_created_success', { room_code: roomCode, platform, video_id: videoId });
        setState(prev => ({
          ...prev,
          roomCode,
          videoId,
          platform,
          isHost: true,
          isConnected: true,
          participants: [{ id: 'self', username: 'Tú', isHost: true }]
        }));
      })
    );

    unsubscribers.push(
      on('room-joined', (data: unknown) => {
        const { videoId, platform, participants, isHost, currentTime, isPlaying } = data as {
          videoId: string;
          platform: VideoPlatform;
          participants: Participant[];
          isHost: boolean;
          currentTime: number;
          isPlaying: boolean;
        };
        if (pendingRoomCode.current && pendingUsername.current) {
          saveRoomToStorage(pendingRoomCode.current, pendingUsername.current);
          posthog.capture('room_joined_success', {
            room_code: pendingRoomCode.current,
            platform,
            participants_count: participants.length,
            is_host: isHost
          });
          pendingUsername.current = null;
          pendingRoomCode.current = null;
        }
        setState(prev => ({
          ...prev,
          videoId,
          platform,
          participants,
          isHost,
          isConnected: true,
          initialTime: currentTime,
          initialPlaying: isPlaying
        }));
      })
    );

    unsubscribers.push(
      on('user-joined', (data: unknown) => {
        const { username, participants } = data as { username: string; participants: Participant[] };
        setState(prev => ({ ...prev, participants }));
        console.log(`${username} se ha unido a la sala`);
      })
    );

    unsubscribers.push(
      on('user-left', (data: unknown) => {
        const { username, participants } = data as { username: string; participants: Participant[] };
        setState(prev => ({ ...prev, participants }));
        console.log(`${username} ha salido de la sala`);
      })
    );

    unsubscribers.push(
      on('became-host', () => {
        posthog.capture('user_became_host');
        setState(prev => ({ ...prev, isHost: true }));
        console.log('Ahora eres el host');
      })
    );

    unsubscribers.push(
      on('error', (data: unknown) => {
        const { message } = data as { message: string };
        posthog.capture('room_error', { error_message: message });
        clearRoomStorage();
        pendingUsername.current = null;
        pendingRoomCode.current = null;
        setState(prev => ({ ...prev, error: message }));
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [on, posthog]);

  // Auto-rejoin room on page refresh
  useEffect(() => {
    if (hasAttemptedRejoin.current) return;

    const storedRoom = getRoomFromStorage();
    if (!storedRoom) return;

    const attemptRejoin = () => {
      if (hasAttemptedRejoin.current) return;
      hasAttemptedRejoin.current = true;

      const { roomCode, username } = storedRoom;
      console.log(`Reconnecting to room ${roomCode} as ${username}...`);
      pendingUsername.current = username;
      pendingRoomCode.current = roomCode;
      setState(prev => ({ ...prev, roomCode }));
      emit('join-room', { roomCode, username });
    };

    // Listen for socket connect event to rejoin
    const unsubConnect = on('connect', attemptRejoin);

    // Also try after a short delay in case socket is already connected
    const timeoutId = setTimeout(attemptRejoin, 100);

    return () => {
      unsubConnect();
      clearTimeout(timeoutId);
    };
  }, [on, emit]);

  const createRoom = useCallback((videoUrl: string, username: string) => {
    pendingUsername.current = username;
    emit('create-room', { videoUrl, username });
  }, [emit]);

  const joinRoom = useCallback((roomCode: string, username: string) => {
    pendingUsername.current = username;
    pendingRoomCode.current = roomCode;
    setState(prev => ({ ...prev, roomCode }));
    emit('join-room', { roomCode, username });
  }, [emit]);

  const leaveRoom = useCallback(() => {
    clearRoomStorage();
    emit('leave-room');
    setState({
      roomCode: null,
      videoId: null,
      platform: null,
      isHost: false,
      participants: [],
      isConnected: false,
      error: null,
      initialTime: 0,
      initialPlaying: false
    });
  }, [emit]);

  const syncTime = useCallback((currentTime: number) => {
    if (stateRef.current.roomCode && stateRef.current.isHost) {
      emit('sync-time', { roomCode: stateRef.current.roomCode, currentTime });
    }
  }, [emit]);

  const emitPlay = useCallback(() => {
    if (stateRef.current.roomCode && stateRef.current.isHost) {
      emit('play', { roomCode: stateRef.current.roomCode });
    }
  }, [emit]);

  const emitPause = useCallback(() => {
    if (stateRef.current.roomCode && stateRef.current.isHost) {
      emit('pause', { roomCode: stateRef.current.roomCode });
    }
  }, [emit]);

  const onSyncUpdate = useCallback((callback: (currentTime: number) => void) => {
    return on('sync-update', (data: unknown) => {
      const { currentTime } = data as { currentTime: number };
      callback(currentTime);
    });
  }, [on]);

  const onPlayVideo = useCallback((callback: () => void) => {
    return on('play-video', callback);
  }, [on]);

  const onPauseVideo = useCallback((callback: () => void) => {
    return on('pause-video', callback);
  }, [on]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return (
    <RoomContext.Provider
      value={{
        ...state,
        createRoom,
        joinRoom,
        leaveRoom,
        syncTime,
        emitPlay,
        emitPause,
        onSyncUpdate,
        onPlayVideo,
        onPauseVideo,
        clearError
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}
