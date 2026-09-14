import { create } from 'zustand';
import api from '../api/client';
import { pickHome } from '../lib/homeContent';

export const useContentStore = create((set, get) => ({
  raw: null,
  loadedAt: 0,
  async load(force = false) {
    const now = Date.now();
    if (!force && get().loadedAt && now - get().loadedAt < 2000) return;
    try {
      const { data } = await api.get('/content');
      set({ raw: data.content || null, loadedAt: Date.now() });
    } catch {
      if (!get().raw) set({ raw: null });
    }
  },
}));

export function useSite() {
  return pickHome(useContentStore((s) => s.raw));
}
