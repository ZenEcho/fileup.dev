
import axios from 'axios';
import { useAuthStore } from './stores/auth';

export const API_BASE_URL = 'https://server.fileup.dev';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});

export default api;
