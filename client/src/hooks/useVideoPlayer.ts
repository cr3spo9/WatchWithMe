import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VideoPlatform } from '@/types/video';
import { loadYouTubeAPI } from '../utils/youtube';
import { loadTwitchAPI } from '../utils/twitch';

interface UseVideoPlayerOptions {
  platform: VideoPlatform | null;
  videoId: string | null;
  onPlay?: () => void;
  onPause?: () => void;
}

interface UseVideoPlayerResult {
  containerRef: React.RefObject<HTMLDivElement>;
  isReady: boolean;
  supportsVariableSpeed: boolean;
  supportsSeek: boolean;
  usesManualClock: boolean;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  setPlaybackRate: (rate: number) => void;
}

type PlayerController = {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  setPlaybackRate?: (rate: number) => void;
  destroy?: () => void;
};

type TwitchResource =
  | { kind: 'channel'; id: string }
  | { kind: 'video'; id: string };

function parseTwitchResource(videoId: string): TwitchResource {
  if (videoId.startsWith('video:')) {
    return { kind: 'video', id: videoId.replace('video:', '') };
  }

  if (videoId.startsWith('channel:')) {
    return { kind: 'channel', id: videoId.replace('channel:', '') };
  }

  return { kind: 'channel', id: videoId };
}

function preparePlayerMount(container: HTMLDivElement): HTMLDivElement {
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  container.innerHTML = '';

  const mount = document.createElement('div');
  mount.style.position = 'absolute';
  mount.style.inset = '0';
  mount.style.width = '100%';
  mount.style.height = '100%';
  mount.style.display = 'block';
  mount.style.backgroundColor = '#000';

  container.appendChild(mount);
  return mount;
}

export function useVideoPlayer({
  platform,
  videoId,
  onPlay,
  onPause
}: UseVideoPlayerOptions): UseVideoPlayerResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerController | null>(null);
  const [isReady, setIsReady] = useState(false);

  const playbackProfile = useMemo(() => {
    if (!platform || !videoId) {
      return {
        type: 'none' as const,
        supportsVariableSpeed: false,
        supportsSeek: false,
        usesManualClock: false,
        twitchResource: null as TwitchResource | null
      };
    }

    if (platform === 'youtube') {
      return {
        type: 'youtube' as const,
        supportsVariableSpeed: true,
        supportsSeek: true,
        usesManualClock: false,
        twitchResource: null
      };
    }

    const resource = parseTwitchResource(videoId);
    if (resource.kind === 'video') {
      return {
        type: 'twitch-vod' as const,
        supportsVariableSpeed: false,
        supportsSeek: true,
        usesManualClock: false,
        twitchResource: resource
      };
    }

    return {
      type: 'twitch-live' as const,
      supportsVariableSpeed: false,
      supportsSeek: false,
      usesManualClock: true,
      twitchResource: resource
    };
  }, [platform, videoId]);

  const { supportsVariableSpeed, supportsSeek, usesManualClock, twitchResource } = playbackProfile;

  const manualBaseRef = useRef(0);
  const manualStartRef = useRef<number | null>(null);
  const manualIntervalRef = useRef<number | null>(null);

  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);

  const clearManualInterval = () => {
    if (manualIntervalRef.current) {
      clearInterval(manualIntervalRef.current);
      manualIntervalRef.current = null;
    }
  };

  const startManualClock = () => {
    if (!usesManualClock || manualIntervalRef.current) return;
    manualStartRef.current = performance.now();
    manualIntervalRef.current = window.setInterval(() => {
      /* noop: manual time is computed via refs, but interval keeps numbers fresh for callers polling */
    }, 250);
  };

  const stopManualClock = () => {
    if (!usesManualClock) return;
    if (manualStartRef.current !== null) {
      manualBaseRef.current = manualBaseRef.current + (performance.now() - manualStartRef.current) / 1000;
      manualStartRef.current = null;
    }
    clearManualInterval();
  };

  const resetManualClock = () => {
    manualBaseRef.current = 0;
    manualStartRef.current = null;
    clearManualInterval();
  };

  const setManualTime = (seconds: number) => {
    manualBaseRef.current = seconds;
    if (manualStartRef.current !== null) {
      manualStartRef.current = performance.now();
    }
  };

  useEffect(() => {
    onPlayRef.current = onPlay;
  }, [onPlay]);

  useEffect(() => {
    onPauseRef.current = onPause;
  }, [onPause]);

  useEffect(() => {
    resetManualClock();
  }, [usesManualClock, platform, videoId]);

  useEffect(() => {
    setIsReady(false);

    if (!platform || !videoId || !containerRef.current) {
      playerRef.current?.destroy?.();
      playerRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      return;
    }

    let isMounted = true;
    let cleanup: (() => void) | undefined;

    const initialize = async () => {
      try {
        if (platform === 'youtube') {
          await loadYouTubeAPI();
          if (!isMounted || !containerRef.current || !window.YT || !window.YT.Player) return;

          const playerElement = preparePlayerMount(containerRef.current);

          const ytPlayer = new window.YT.Player(playerElement, {
            videoId,
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 0,
              controls: 1,
              modestbranding: 1,
              rel: 0,
              playsinline: 1
            },
            events: {
              onReady: () => {
                if (!isMounted) return;
                playerRef.current = {
                  play: () => ytPlayer.playVideo(),
                  pause: () => ytPlayer.pauseVideo(),
                  seekTo: (seconds: number) => ytPlayer.seekTo(seconds, true),
                  getCurrentTime: () => ytPlayer.getCurrentTime() ?? 0,
                  setPlaybackRate: (rate: number) => ytPlayer.setPlaybackRate(rate),
                  destroy: () => ytPlayer.destroy()
                };
                setIsReady(true);
              },
              onStateChange: (event) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  onPlayRef.current?.();
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  onPauseRef.current?.();
                }
              }
            }
          });

          cleanup = () => {
            ytPlayer.destroy();
          };
        } else {
          await loadTwitchAPI();
          const twitchApi = window.Twitch;
          if (!isMounted || !containerRef.current || !twitchApi || !twitchApi.Player) return;

          const resource = twitchResource ?? parseTwitchResource(videoId);
          const playerElement = preparePlayerMount(containerRef.current);
          const playerId = `twitch-player-${Date.now()}`;
          playerElement.id = playerId;

          const parentDomain = window.location.hostname || 'localhost';
          const twitchPlayer = new twitchApi.Player(playerId, {
            width: '100%',
            height: '100%',
            autoplay: false,
            controls: true,
            parent: [parentDomain],
            ...(resource.kind === 'channel'
              ? { channel: resource.id }
              : { video: resource.id })
          });

          const handleReady = () => {
            if (!isMounted) return;
            playerRef.current = {
              play: () => twitchPlayer.play(),
              pause: () => twitchPlayer.pause(),
              seekTo: (seconds: number) => {
                if (typeof twitchPlayer.seek === 'function') {
                  twitchPlayer.seek(seconds);
                }
              },
              getCurrentTime: () => {
                if (typeof twitchPlayer.getCurrentTime === 'function') {
                  return twitchPlayer.getCurrentTime();
                }
                if (usesManualClock && manualStartRef.current !== null) {
                  return manualBaseRef.current + (performance.now() - manualStartRef.current) / 1000;
                }
                return manualBaseRef.current;
              },
              destroy: () => twitchPlayer.destroy()
            };
            setIsReady(true);
          };

          const handlePlay = () => {
            if (usesManualClock) startManualClock();
            onPlayRef.current?.();
          };
          const handlePause = () => {
            if (usesManualClock) stopManualClock();
            onPauseRef.current?.();
          };

          twitchPlayer.addEventListener(twitchApi.Player.READY, handleReady);
          twitchPlayer.addEventListener(twitchApi.Player.PLAY, handlePlay);
          twitchPlayer.addEventListener(twitchApi.Player.PAUSE, handlePause);

          cleanup = () => {
            twitchPlayer.removeEventListener(twitchApi.Player.READY, handleReady);
            twitchPlayer.removeEventListener(twitchApi.Player.PLAY, handlePlay);
            twitchPlayer.removeEventListener(twitchApi.Player.PAUSE, handlePause);
            twitchPlayer.destroy();
          };
        }
      } catch (error) {
        console.error('Error al inicializar el reproductor', error);
      }
    };

    initialize();

    return () => {
      isMounted = false;
      cleanup?.();
      resetManualClock();
      playerRef.current = null;
      setIsReady(false);
    };
  }, [platform, videoId, twitchResource, usesManualClock]);

  const play = useCallback(() => {
    playerRef.current?.play();
    if (usesManualClock) {
      startManualClock();
    }
  }, [usesManualClock]);

  const pause = useCallback(() => {
    playerRef.current?.pause();
    if (usesManualClock) {
      stopManualClock();
    }
  }, [usesManualClock]);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
    if (usesManualClock) {
      setManualTime(seconds);
    }
  }, [usesManualClock]);

  const getCurrentTime = useCallback((): number => {
    if (usesManualClock) {
      if (manualStartRef.current !== null) {
        return manualBaseRef.current + (performance.now() - manualStartRef.current) / 1000;
      }
      return manualBaseRef.current;
    }
    return playerRef.current?.getCurrentTime() ?? 0;
  }, [usesManualClock]);

  const setPlaybackRate = useCallback((rate: number) => {
    playerRef.current?.setPlaybackRate?.(rate);
  }, []);

  return {
    containerRef,
    isReady,
    supportsVariableSpeed,
    supportsSeek,
    usesManualClock,
    play,
    pause,
    seekTo,
    getCurrentTime,
    setPlaybackRate
  };
}
