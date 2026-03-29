import axios from 'axios';
import { isNavigationFailure, NavigationFailureType } from 'vue-router';
import router from '@/router';
import { useAuthStore } from '@common/stores/auth';

const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:3000/api'
  : 'https://server.fileup.dev/api';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  DEFAULT_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

const AUTH_PAGE_PREFIXES = ['/login', '/register', '/auth/'];
let isRedirectingToLogin = false;

const redirectToLogin = async () => {
  if (isRedirectingToLogin) {
    return;
  }

  const { path, fullPath } = router.currentRoute.value;
  const shouldKeepNext = !AUTH_PAGE_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (path === '/login' && !shouldKeepNext) {
    return;
  }

  isRedirectingToLogin = true;
  try {
    await router.replace({
      path: '/login',
      query: shouldKeepNext ? { next: fullPath } : undefined,
    });
  } catch (error) {
    if (!isNavigationFailure(error, NavigationFailureType.duplicated)) {
      console.error('Redirect to login failed:', error);
    }
  } finally {
    isRedirectingToLogin = false;
  }
};

apiClient.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore();
    const status = (error as { response?: { status?: number } }).response?.status;

    if (status === 401 && authStore.token) {
      authStore.logout();
      await redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
