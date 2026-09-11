import { create } from 'zustand';
import api from '../api/client';
import { pickHome } from '../lib/homeContent';

export const useContentStore = create((set) => ({
  raw: null,
  async load() {
    try {
      const { data } = await api.get('/content');
      set({ raw: data.content || null });
    } catch {
      set({ raw: null });
    }
  },
}));

export function useSite() {
  return pickHome(useContentStore((s) => s.raw));
}
