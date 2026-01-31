import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';

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

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const { emit, on } = useSocket();
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
        setState(prev => ({ ...prev, error: message }));
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [on]);

  const createRoom = useCallback((videoUrl: string, username: string) => {
    emit('create-room', { videoUrl, username });
  }, [emit]);

  const joinRoom = useCallback((roomCode: string, username: string) => {
    setState(prev => ({ ...prev, roomCode }));
    emit('join-room', { roomCode, username });
  }, [emit]);

  const leaveRoom = useCallback(() => {
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
