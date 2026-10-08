// First-load screen: the wordmark until content, settings, fonts and the page are ready
// (capped so a slow request never holds the site back).
import { useEffect, useRef, useState } from 'react';
import { useContentStore } from '../../store/contentStore';
import { useBrand, useSettingsStore } from '../../store/settingsStore';
import { useBootStore } from '../../store/bootStore';
import BrandMark from './BrandMark';

export default function BootScreen() {
  const contentReady = useContentStore((s) => s.loadedAt > 0);
  const settingsReady = useSettingsStore((s) => s.loadedAt > 0);
  const pageReady = useBootStore((s) => s.pageReady);
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
    const cap = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      setLeaving(true);
      window.setTimeout(() => setOpen(false), reduced ? 80 : 280);
    }, reduced ? 2500 : 8000);
    return () => window.clearTimeout(cap);
  }, []);

  useEffect(() => {
    if (done.current || leaving) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minMs = reduced ? 40 : 160;

    const finish = () => {
      if (done.current) return;
      done.current = true;
      setLeaving(true);
      window.setTimeout(() => setOpen(false), reduced ? 60 : 280);
    };

    const tryFinish = () => {
      if (performance.now() - started.current < minMs) return;
      if (contentReady && settingsReady && fontsReady && pageReady) finish();
    };

    tryFinish();
    const waitMin = window.setTimeout(tryFinish, minMs);
    return () => window.clearTimeout(waitMin);
  }, [contentReady, settingsReady, fontsReady, pageReady, leaving]);

  if (!open) return null;

  return (
    <div className={`sky-boot sky-boot-nx${leaving ? ' is-out' : ''}`} aria-busy="true" aria-live="polite">
      <div className="sky-boot-nx-mark">
        <BrandMark name={brand.display || 'Kuberstones'} stack />
        <span aria-hidden />
      </div>
    </div>
  );
}
