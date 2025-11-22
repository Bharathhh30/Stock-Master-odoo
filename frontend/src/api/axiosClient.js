import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
const api = axios.create({
  baseURL: API_BASE + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});
export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}
export default api;
