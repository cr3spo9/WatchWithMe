/// <reference types="vite/client" />

interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady: () => void;
}
