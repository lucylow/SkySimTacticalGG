import axios from 'axios';

const API_BASE = (import.meta as any).env.VITE_API_URL ?? 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Standardized error handling
    console.error('API error', err.response?.data ?? err.message);
    return Promise.reject(err);
  }
);

export const fetchProducts = async () => {
  const r = await api.get('/products');
  return r.data;
};

export const fetchSessions = async () => {
  const r = await api.get('/sessions');
  return r.data;
};

export const startAgentStreamUrl = (prompt = '') => `${API_BASE.replace('/api', '')}/agent/stream?prompt=${encodeURIComponent(prompt)}`;

export default api;
