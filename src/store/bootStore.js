import { create } from 'zustand';

export const useBootStore = create((set) => ({
  pageReady: false,
  markPageReady: () => set({ pageReady: true }),
}));
