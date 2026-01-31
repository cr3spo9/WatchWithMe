import { useEffect, useRef, useState, useCallback } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useRoom } from '../context/RoomContext';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import { ParticipantsList } from './ParticipantsList';
import { SyncStatus } from './SyncStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, LogOut, Share2, Clock } from 'lucide-react';

const SYNC_INTERVAL = 500; // Sync check every 500ms
const SYNC_THRESHOLD = 0.3; // Start adjusting speed if difference > 0.3 seconds
const SEEK_THRESHOLD = 5; // Only seekTo if difference > 5 seconds
const TIME_UPDATE_INTERVAL = 100; // Update time display every 100ms
const SPEED_FACTOR = 0.15; // How aggressively to adjust speed (0.1 = gentle, 0.3 = aggressive)
const MIN_SPEED = 0.75;
const MAX_SPEED = 1.5;

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function VideoPlayer() {
  const {
    videoId,
    roomCode,
    isHost,
    leaveRoom,
    syncTime,
    emitPlay,
    emitPause,
    onSyncUpdate,
    onPlayVideo,
    onPauseVideo,
    initialTime,
    initialPlaying
  } = useRoom();

  const [isSynced, setIsSynced] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hostTime, setHostTime] = useState(0);
  const [timeDiff, setTimeDiff] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const syncIntervalRef = useRef<number | null>(null);
  const timeDisplayRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  const handleStateChange = useCallback((state: number) => {
    if (!isHost) return;
    if (state === 1) emitPlay();
    else if (state === 2) emitPause();
  }, [isHost, emitPlay, emitPause]);

  const handleReady = useCallback(() => {
    if (!isHost && !isInitializedRef.current) {
      isInitializedRef.current = true;
      if (initialTime > 0) seekTo(initialTime);
      if (initialPlaying) play();
    }
  }, [isHost, initialTime, initialPlaying]);

  const {
    containerRef,
    isReady,
    play,
    pause,
    seekTo,
    getCurrentTime,
    setPlaybackRate
  } = useYouTubePlayer({
    videoId,
    onStateChange: handleStateChange,
    onReady: handleReady
  });

  // Update time display frequently
  useEffect(() => {
    if (!isReady) return;

    timeDisplayRef.current = window.setInterval(() => {
      const time = getCurrentTime();
      setCurrentTime(time);
      if (isHost) {
        setHostTime(time);
      }
    }, TIME_UPDATE_INTERVAL);

    return () => {
      if (timeDisplayRef.current) clearInterval(timeDisplayRef.current);
    };
  }, [isReady, getCurrentTime, isHost]);

  useEffect(() => {
    if (!isHost || !isReady) return;

    syncIntervalRef.current = window.setInterval(() => {
      const time = getCurrentTime();
      syncTime(time);
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [isHost, isReady, getCurrentTime, syncTime]);

  useEffect(() => {
    if (isHost || !isReady) return;

    const unsubSync = onSyncUpdate((receivedHostTime: number) => {
      const myTime = getCurrentTime();
      const diff = receivedHostTime - myTime;

      setHostTime(receivedHostTime);
      setTimeDiff(diff);

      // If difference is too large, just seek
      if (Math.abs(diff) > SEEK_THRESHOLD) {
        setIsSynced(false);
        seekTo(receivedHostTime);
        setPlaybackRate(1);
        setPlaybackRateState(1);
        setTimeout(() => setIsSynced(true), 500);
        return;
      }

      // If difference is within threshold, adjust playback speed
      if (Math.abs(diff) > SYNC_THRESHOLD) {
        setIsSynced(false);
        // Calculate new speed: faster if behind, slower if ahead
        // diff > 0 means we're behind (host is ahead), so speed up
        // diff < 0 means we're ahead (host is behind), so slow down
        let newSpeed = 1 + (diff * SPEED_FACTOR);
        newSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, newSpeed));

        setPlaybackRate(newSpeed);
        setPlaybackRateState(newSpeed);
      } else {
        // We're synced, return to normal speed
        setIsSynced(true);
        if (playbackRate !== 1) {
          setPlaybackRate(1);
          setPlaybackRateState(1);
        }
      }
    });

    const unsubPlay = onPlayVideo(() => play());
    const unsubPause = onPauseVideo(() => pause());

    return () => {
      unsubSync();
      unsubPlay();
      unsubPause();
    };
  }, [isHost, isReady, onSyncUpdate, onPlayVideo, onPauseVideo, getCurrentTime, seekTo, play, pause, setPlaybackRate, playbackRate]);

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              WatchWithMe
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="gap-2 px-3 py-1.5 font-mono">
                Sala: <span className="font-bold tracking-wider">{roomCode}</span>
                <button onClick={copyRoomCode} className="hover:text-primary transition-colors">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </Badge>
              <SyncStatus isSynced={isSynced} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={leaveRoom}
              variant="destructive"
              size="sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Salir
            </Button>
            <UserButton
              appearance={{
                baseTheme: dark,
                elements: {
                  avatarBox: "w-9 h-9"
                }
              }}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video */}
          <div className="lg:col-span-3 space-y-3">
            <div
              ref={containerRef}
              className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-border/50"
            />

            {/* Time Debug Panel */}
            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardContent className="py-3">
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Tu tiempo:</span>
                    <span className="font-mono text-lg font-bold text-foreground bg-secondary/50 px-3 py-1 rounded">
                      {formatTime(currentTime)}
                    </span>
                  </div>

                  {!isHost && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Host:</span>
                        <span className="font-mono text-lg font-bold text-cyan-400 bg-secondary/50 px-3 py-1 rounded">
                          {formatTime(hostTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Diff:</span>
                        <span className={`font-mono text-lg font-bold px-3 py-1 rounded ${
                          Math.abs(timeDiff) > SYNC_THRESHOLD
                            ? 'text-red-400 bg-red-500/20'
                            : Math.abs(timeDiff) > 0.1
                              ? 'text-yellow-400 bg-yellow-500/20'
                              : 'text-green-400 bg-green-500/20'
                        }`}>
                          {timeDiff >= 0 ? '+' : ''}{timeDiff.toFixed(2)}s
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Velocidad:</span>
                        <span className={`font-mono text-lg font-bold px-3 py-1 rounded ${
                          playbackRate > 1
                            ? 'text-blue-400 bg-blue-500/20'
                            : playbackRate < 1
                              ? 'text-orange-400 bg-orange-500/20'
                              : 'text-green-400 bg-green-500/20'
                        }`}>
                          {playbackRate.toFixed(2)}x
                        </span>
                      </div>
                    </>
                  )}

                  {isHost && (
                    <Badge variant="warning" className="text-sm">
                      Eres el Host - Tu tiempo es la referencia
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {!isHost && (
              <p className="text-muted-foreground text-sm text-center">
                Solo el host puede controlar la reproduccion. Tu video se sincroniza automaticamente.
              </p>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <ParticipantsList />

            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Comparte la sala
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-muted-foreground text-sm">
                  Envia este codigo a tus amigos:
                </p>
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <span className="text-3xl font-mono font-bold tracking-widest text-foreground">
                    {roomCode}
                  </span>
                </div>
                <Button
                  onClick={copyRoomCode}
                  variant="secondary"
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar codigo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
