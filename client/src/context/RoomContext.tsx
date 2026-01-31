import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';

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
  const { emit, on } = useSocket();
  const hasAttemptedRejoin = useRef(false);
  const pendingUsername = useRef<string | null>(null);
  const pendingRoomCode = useRef<string | null>(null);
  const [state, setState] = useState<RoomState>({
    roomCode: null,
    videoId: null,
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
        const { roomCode, videoId } = data as { roomCode: string; videoId: string };
        if (pendingUsername.current) {
          saveRoomToStorage(roomCode, pendingUsername.current);
          pendingUsername.current = null;
        }
        setState(prev => ({
          ...prev,
          roomCode,
          videoId,
          isHost: true,
          isConnected: true,
          participants: [{ id: 'self', username: 'Tú', isHost: true }]
        }));
      })
    );

    unsubscribers.push(
      on('room-joined', (data: unknown) => {
        const { videoId, participants, isHost, currentTime, isPlaying } = data as {
          videoId: string;
          participants: Participant[];
          isHost: boolean;
          currentTime: number;
          isPlaying: boolean;
        };
        if (pendingRoomCode.current && pendingUsername.current) {
          saveRoomToStorage(pendingRoomCode.current, pendingUsername.current);
          pendingUsername.current = null;
          pendingRoomCode.current = null;
        }
        setState(prev => ({
          ...prev,
          videoId,
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
        setState(prev => ({ ...prev, isHost: true }));
        console.log('Ahora eres el host');
      })
    );

    unsubscribers.push(
      on('error', (data: unknown) => {
        const { message } = data as { message: string };
        clearRoomStorage();
        pendingUsername.current = null;
        pendingRoomCode.current = null;
        setState(prev => ({ ...prev, error: message }));
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [on]);

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
