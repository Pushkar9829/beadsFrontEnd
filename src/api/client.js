import axios from 'axios';

export const API_ORIGIN = String(import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/$/, '');

const TOKEN_KEY = 'kuberstones-token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

const api = axios.create({
  baseURL: API_ORIGIN ? `${API_ORIGIN}/api` : '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message || 'Request failed.';
    return Promise.reject({ ...err, message, status });
  }
);

export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/catalog') || path.startsWith('/assets') || path.startsWith('/src')) return path;
  if (API_ORIGIN) return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
  return path;
}

export default api;
