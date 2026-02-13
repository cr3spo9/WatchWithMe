import { Room, Participant, VideoPlatform } from '../types/index.js';

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

type ParsedVideo = { platform: VideoPlatform; videoId: string } | null;

function parseVideoUrl(url: string): ParsedVideo {
  const youtubePatterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of youtubePatterns) {
    const match = url.match(pattern);
    if (match) return { platform: 'youtube', videoId: match[1] };
  }

  const trimmed = url.trim();

  // Twitch VOD URLs look like https://www.twitch.tv/videos/<id>
  const twitchVodMatch = trimmed.match(/twitch\.tv\/videos\/(\d+)/i);
  if (twitchVodMatch) {
    return { platform: 'twitch', videoId: `video:${twitchVodMatch[1]}` };
  }

  // Twitch live URLs look like https://www.twitch.tv/<channel>
  const twitchChannelMatch = trimmed.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
  if (twitchChannelMatch) {
    return { platform: 'twitch', videoId: `channel:${twitchChannelMatch[1].toLowerCase()}` };
  }

  // Allow passing just the channel name
  if (/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { platform: 'twitch', videoId: `channel:${trimmed.toLowerCase()}` };
  }

  return null;
}

export function createRoom(videoUrl: string, hostId: string, username: string): Room | null {
  const parsed = parseVideoUrl(videoUrl.trim());
  if (!parsed) return null;

  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const host: Participant = {
    id: hostId,
    username,
    isHost: true
  };

  const room: Room = {
    code,
    platform: parsed.platform,
    videoId: parsed.videoId,
    hostId,
    participants: new Map([[hostId, host]]),
    currentTime: 0,
    isPlaying: false
  };

  rooms.set(code, room);
  return room;
}

export function joinRoom(roomCode: string, participantId: string, username: string): Room | null {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) return null;

  const participant: Participant = {
    id: participantId,
    username,
    isHost: false
  };

  room.participants.set(participantId, participant);
  return room;
}

export function leaveRoom(roomCode: string, participantId: string): { room: Room | null; wasHost: boolean; newHostId: string | null } {
  const room = rooms.get(roomCode);
  if (!room) return { room: null, wasHost: false, newHostId: null };

  const participant = room.participants.get(participantId);
  const wasHost = participant?.isHost ?? false;

  room.participants.delete(participantId);

  // If room is empty, delete it
  if (room.participants.size === 0) {
    rooms.delete(roomCode);
    return { room: null, wasHost, newHostId: null };
  }

  // If host left, assign new host
  let newHostId: string | null = null;
  if (wasHost) {
    const newHost = room.participants.values().next().value;
    if (newHost) {
      newHost.isHost = true;
      room.hostId = newHost.id;
      newHostId = newHost.id;
    }
  }

  return { room, wasHost, newHostId };
}

export function getRoom(roomCode: string): Room | null {
  return rooms.get(roomCode.toUpperCase()) || null;
}

export function updateRoomTime(roomCode: string, currentTime: number): void {
  const room = rooms.get(roomCode);
  if (room) {
    room.currentTime = currentTime;
  }
}

export function updateRoomPlayState(roomCode: string, isPlaying: boolean): void {
  const room = rooms.get(roomCode);
  if (room) {
    room.isPlaying = isPlaying;
  }
}

export function isHost(roomCode: string, participantId: string): boolean {
  const room = rooms.get(roomCode);
  return room?.hostId === participantId;
}

export function getParticipantsList(room: Room): { id: string; username: string; isHost: boolean }[] {
  return Array.from(room.participants.values()).map(p => ({
    id: p.id,
    username: p.username,
    isHost: p.isHost
  }));
}
