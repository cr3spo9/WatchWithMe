export interface Room {
  code: string;
  videoId: string;
  hostId: string;
  participants: Map<string, Participant>;
  currentTime: number;
  isPlaying: boolean;
}

export interface Participant {
  id: string;
  username: string;
  isHost: boolean;
}

export interface CreateRoomPayload {
  videoUrl: string;
  username: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  username: string;
}

export interface SyncTimePayload {
  roomCode: string;
  currentTime: number;
}

export interface PlayPausePayload {
  roomCode: string;
}
