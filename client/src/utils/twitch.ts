let twitchApiPromise: Promise<void> | null = null;

function waitForTwitchReady(resolve: (value?: void) => void) {
  const check = () => {
    if (window.Twitch && window.Twitch.Player) {
      resolve();
    } else {
      setTimeout(check, 50);
    }
  };
  check();
}

export function loadTwitchAPI(): Promise<void> {
  if (window.Twitch && window.Twitch.Player) {
    return Promise.resolve();
  }

  if (!twitchApiPromise) {
    twitchApiPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[src*="player.twitch.tv/js/embed/v1.js"]');

      if (existingScript) {
        waitForTwitchReady(resolve);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://player.twitch.tv/js/embed/v1.js';
      script.async = true;
      script.onload = () => waitForTwitchReady(resolve);
      script.onerror = () => reject(new Error('No se pudo cargar el reproductor de Twitch'));

      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.body.appendChild(script);
      }
    }).catch(error => {
      twitchApiPromise = null;
      throw error;
    });
  }

  return twitchApiPromise!;
}
