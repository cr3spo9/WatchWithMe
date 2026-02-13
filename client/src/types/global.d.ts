export {};

declare global {
  interface Window {
    Twitch?: {
      Player: {
        new (elementId: string, options: Record<string, unknown>): {
          play(): void;
          pause(): void;
          seek?(seconds: number): void;
          getCurrentTime?(): number;
          destroy(): void;
          addEventListener(event: string, callback: () => void): void;
          removeEventListener(event: string, callback: () => void): void;
        };
        READY: string;
        PLAY: string;
        PAUSE: string;
      };
    };
  }
}
