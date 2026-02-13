import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { usePostHog } from '@posthog/react';
import { useRoom } from '../context/RoomContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Users } from 'lucide-react';

export function RoomControls() {
  const { user } = useUser();
  const posthog = usePostHog();
  const { createRoom, joinRoom, error, clearError } = useRoom();
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [videoUrl, setVideoUrl] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const username = user?.username || user?.firstName || 'Usuario';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoUrl) {
      posthog.capture('room_created', { username });
      createRoom(videoUrl, username);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode) {
      posthog.capture('room_joined', { roomCode, username });
      joinRoom(roomCode, username);
    }
  };

  if (mode === 'select') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              WatchWithMe
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Hola <span className="text-cyan-400 font-medium">{username}</span>, ve directos sincronizados con tus amigos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => setMode('create')}
              className="w-full h-14 text-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Crear Sala
            </Button>

            <Button
              onClick={() => setMode('join')}
              variant="secondary"
              className="w-full h-14 text-lg"
              size="lg"
            >
              <Users className="mr-2 h-5 w-5" />
              Unirse a Sala
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-border/50">
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => { setMode('select'); clearError(); }}
              className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <CardTitle className="text-2xl">Crear Sala</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/20 border border-destructive text-destructive-foreground px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  URL del directo de YouTube
                </label>
                <Input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                size="lg"
              >
                Crear Sala
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-border/50">
        <CardHeader>
          <Button
            variant="ghost"
            onClick={() => { setMode('select'); clearError(); }}
            className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <CardTitle className="text-2xl">Unirse a Sala</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/20 border border-destructive text-destructive-foreground px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Codigo de sala
              </label>
              <Input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="uppercase tracking-widest text-center text-xl font-mono"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              size="lg"
            >
              Unirse
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
