import { useEffect, useRef } from 'react';
import { isStorefrontRevEvent } from '../lib/storefrontSync';

export default function useRefreshOnView(callback) {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    const run = (force) => cb.current?.(force);
    run(false);
    const onVisible = () => {
      if (document.visibilityState === 'visible') run(true);
    };
    const onStorage = (event) => {
      if (isStorefrontRevEvent(event)) run(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
}
