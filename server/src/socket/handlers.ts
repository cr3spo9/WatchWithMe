import { Server, Socket } from 'socket.io';
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  updateRoomTime,
  updateRoomPlayState,
  isHost,
  getParticipantsList
} from './rooms.js';
import {
  CreateRoomPayload,
  JoinRoomPayload,
  SyncTimePayload,
  PlayPausePayload
} from '../types/index.js';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);
    let currentRoom: string | null = null;

    // Create a new room
    socket.on('create-room', ({ videoUrl, username }: CreateRoomPayload) => {
      const room = createRoom(videoUrl, socket.id, username);

      if (!room) {
        socket.emit('error', { message: 'URL de video inválida' });
        return;
      }

      currentRoom = room.code;
      socket.join(room.code);

      socket.emit('room-created', {
        roomCode: room.code,
        videoId: room.videoId
      });

      console.log(`Room created: ${room.code} by ${username}`);
    });

    // Join existing room
    socket.on('join-room', ({ roomCode, username }: JoinRoomPayload) => {
      const room = joinRoom(roomCode, socket.id, username);

      if (!room) {
        socket.emit('error', { message: 'Sala no encontrada' });
        return;
      }

      currentRoom = room.code;
      socket.join(room.code);

      // Notify the joiner
      socket.emit('room-joined', {
        videoId: room.videoId,
        participants: getParticipantsList(room),
        isHost: false,
        currentTime: room.currentTime,
        isPlaying: room.isPlaying
      });

      // Notify others in the room
      socket.to(room.code).emit('user-joined', {
        username,
        participants: getParticipantsList(room)
      });

      console.log(`${username} joined room: ${room.code}`);
    });

    // Leave room
    socket.on('leave-room', () => {
      if (!currentRoom) return;

      const room = getRoom(currentRoom);
      const participant = room?.participants.get(socket.id);

      const result = leaveRoom(currentRoom, socket.id);
      socket.leave(currentRoom);

      if (result.room) {
        socket.to(currentRoom).emit('user-left', {
          username: participant?.username,
          participants: getParticipantsList(result.room)
        });

        if (result.newHostId) {
          io.to(result.newHostId).emit('became-host');
        }
      }

      currentRoom = null;
    });

    // Sync time from host
    socket.on('sync-time', ({ roomCode, currentTime }: SyncTimePayload) => {
      if (!isHost(roomCode, socket.id)) return;

      updateRoomTime(roomCode, currentTime);
      socket.to(roomCode).emit('sync-update', { currentTime });
    });

    // Play video
    socket.on('play', ({ roomCode }: PlayPausePayload) => {
      if (!isHost(roomCode, socket.id)) return;

      updateRoomPlayState(roomCode, true);
      socket.to(roomCode).emit('play-video');
    });

    // Pause video
    socket.on('pause', ({ roomCode }: PlayPausePayload) => {
      if (!isHost(roomCode, socket.id)) return;

      updateRoomPlayState(roomCode, false);
      socket.to(roomCode).emit('pause-video');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);

      if (currentRoom) {
        const room = getRoom(currentRoom);
        const participant = room?.participants.get(socket.id);

        const result = leaveRoom(currentRoom, socket.id);

        if (result.room) {
          io.to(currentRoom).emit('user-left', {
            username: participant?.username,
            participants: getParticipantsList(result.room)
          });

          if (result.newHostId) {
            io.to(result.newHostId).emit('became-host');
          }
        }
      }
    });
  });
}
