import { useEffect, useRef, useState } from 'react';
import { useContentStore } from '../../store/contentStore';
import { useBrand, useSettingsStore } from '../../store/settingsStore';

export default function SkyBoot({ skyReady }) {
  const contentReady = useContentStore((s) => s.loadedAt > 0);
  const settingsReady = useSettingsStore((s) => s.loadedAt > 0);
  const brand = useBrand();
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [fontsReady, setFontsReady] = useState(typeof document === 'undefined' || !document.fonts || document.fonts.status === 'loaded');
  const started = useRef(performance.now());
  const done = useRef(false);

  useEffect(() => {
    if (!document.fonts) {
      setFontsReady(true);
      return undefined;
    }
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive) setFontsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hide = window.setTimeout(() => setOpen(false), reduced ? 480 : 1600);
    const cap = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      setLeaving(true);
    }, reduced ? 400 : 1200);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(cap);
    };
  }, []);

  useEffect(() => {
    if (done.current || leaving) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minMs = reduced ? 60 : 220;

    const finish = () => {
      if (done.current) return;
      done.current = true;
      setLeaving(true);
      window.setTimeout(() => setOpen(false), reduced ? 60 : 280);
    };

    const tryFinish = () => {
      if (performance.now() - started.current < minMs) return;
      if (skyReady && contentReady && settingsReady && fontsReady) finish();
    };

    tryFinish();
    const waitMin = window.setTimeout(tryFinish, minMs);
    return () => window.clearTimeout(waitMin);
  }, [skyReady, contentReady, settingsReady, fontsReady, leaving]);

  if (!open) return null;

  return (
    <div className={`sky-boot${leaving ? ' is-out' : ''}`} aria-busy="true" aria-live="polite">
      <div className="sky-boot-mist" aria-hidden />
      <div className="sky-boot-mark">
        <span className="sky-boot-ring" aria-hidden />
        <p className="sky-boot-name gold-text">{brand.display || 'Kuberstones'}</p>
        <p className="sky-boot-kicker">{brand.tagline || 'Personalized With Purpose'}</p>
      </div>
    </div>
  );
}
