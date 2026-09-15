import { useEffect, useRef } from 'react';

const SKY_SRC = '/atmosphere/sky.mp4';

export default function Atmosphere() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    async function playSafe() {
      if (reduced.matches || document.visibilityState !== 'visible') {
        video.pause();
        return;
      }
      try {
        await video.play();
      } catch {
        /* Autoplay can wait until the tab is visible. */
      }
    }

    function onVis() {
      if (document.visibilityState === 'visible') playSafe();
      else video.pause();
    }

    function onMotion(event) {
      if (event.matches) video.pause();
      else playSafe();
    }

    playSafe();
    document.addEventListener('visibilitychange', onVis);
    reduced.addEventListener('change', onMotion);

    return () => {
      video.pause();
      document.removeEventListener('visibilitychange', onVis);
      reduced.removeEventListener('change', onMotion);
    };
  }, []);

  return (
    <div className="atm" aria-hidden>
      <video
        ref={videoRef}
        className="atm-video"
        src={SKY_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    </div>
  );
}
