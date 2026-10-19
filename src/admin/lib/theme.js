import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Admin colour theme: 'light', 'dark' or 'system' (follows the operating system). The resolved theme is
// written to <html data-admin-theme>, which theme.css reads; it is removed again when the admin unmounts
// so the storefront never sees it.
const KEY = 'ks-admin-theme';
const MODES = ['light', 'dark', 'system'];

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Match system' },
];

function readMode() {
  try {
    const v = localStorage.getItem(KEY);
    return MODES.includes(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

function systemTheme() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function useAdminThemeState() {
  const [mode, setModeState] = useState(readMode);
  const [system, setSystem] = useState(systemTheme);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: light)');
    if (!mq) return undefined;
    const onChange = () => setSystem(mq.matches ? 'light' : 'dark');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolved = mode === 'system' ? system : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('is-theme-switching');
    root.dataset.adminTheme = resolved;
    const id = setTimeout(() => root.classList.remove('is-theme-switching'), 260);
    return () => clearTimeout(id);
  }, [resolved]);

  useEffect(
    () => () => {
      delete document.documentElement.dataset.adminTheme;
      document.documentElement.classList.remove('is-theme-switching');
    },
    []
  );

  const setMode = useCallback((next) => {
    if (!MODES.includes(next)) return;
    setModeState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return { mode, resolved, setMode };
}

export const AdminThemeContext = createContext({ mode: 'system', resolved: 'dark', setMode: () => {} });

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
