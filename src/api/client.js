import axios from 'axios';

export const API_ORIGIN = String(import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/$/, '');

const api = axios.create({
  baseURL: API_ORIGIN ? `${API_ORIGIN}/api` : '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Request failed.';
    return Promise.reject({ ...err, message, status: err.response?.status });
  }
);

export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/catalog')) return path;
  if (API_ORIGIN) return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
  return path;
}

export default api;
