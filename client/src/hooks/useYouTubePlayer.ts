import { useEffect, useRef, useState, useCallback } from 'react';
import { loadYouTubeAPI } from '../utils/youtube';

interface UseYouTubePlayerOptions {
  videoId: string | null;
  onStateChange?: (state: number) => void;
  onReady?: () => void;
}

export function useYouTubePlayer({ videoId, onStateChange, onReady }: UseYouTubePlayerOptions) {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    let player: YT.Player | null = null;

    const initPlayer = async () => {
      await loadYouTubeAPI();

      if (!containerRef.current) return;

      // Create a div for the player
      const playerDiv = document.createElement('div');
      playerDiv.id = 'youtube-player';
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(playerDiv);

      player = new window.YT.Player('youtube-player', {
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
            playerRef.current = player;
            setIsReady(true);
            onReady?.();
          },
          onStateChange: (event) => {
            onStateChange?.(event.data);
          }
        }
      });
    };

    initPlayer();

    return () => {
      player?.destroy();
      playerRef.current = null;
      setIsReady(false);
    };
  }, [videoId, onStateChange, onReady]);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  const getCurrentTime = useCallback((): number => {
    return playerRef.current?.getCurrentTime() ?? 0;
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    playerRef.current?.setPlaybackRate(rate);
  }, []);

  return {
    containerRef,
    isReady,
    play,
    pause,
    seekTo,
    getCurrentTime,
    setPlaybackRate
  };
}
