import { create } from 'zustand';
import api from '../api/client';

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  async hydrate() {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, loading: false });
      return data.user;
    } catch {
      set({ user: null, loading: false });
      return null;
    }
  },

  async login(email, password) {
    set({ error: null });
    const { data } = await api.post('/auth/login', { email, password });
    set({ user: data.user });
    return data.user;
  },

  async register(payload) {
    set({ error: null });
    const { data } = await api.post('/auth/register', payload);
    set({ user: data.user });
    return data.user;
  },

  async logout() {
    await api.post('/auth/logout');
    set({ user: null });
  },

  async updateProfile(payload) {
    const { data } = await api.put('/auth/profile', payload);
    set({ user: data.user });
    return data.user;
  },

  isAdmin: () => get().user?.role === 'admin',
}));
