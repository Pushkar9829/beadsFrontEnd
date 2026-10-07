import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps list filters, search, sort and page in the URL so views are shareable, survive a refresh
 * and work with the back button. Changing any filter resets page to 1.
 *   const [state, set] = useUrlState({ q: '', status: 'all', page: 1 });
 */
export function useUrlState(defaults = {}) {
  const [params, setParams] = useSearchParams();
  const defaultsKey = JSON.stringify(defaults);

  const state = useMemo(() => {
    const base = JSON.parse(defaultsKey);
    const out = { ...base };
    for (const key of Object.keys(base)) {
      const v = params.get(key);
      if (v !== null) out[key] = typeof base[key] === 'number' ? Number(v) || base[key] : v;
    }
    return out;
  }, [params, defaultsKey]);

  const set = useCallback(
    (patch) => {
      const base = JSON.parse(defaultsKey);
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === null || v === '' || v === base[k]) next.delete(k);
            else next.set(k, String(v));
          }
          if (!('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setParams, defaultsKey]
  );

  return [state, set];
}
