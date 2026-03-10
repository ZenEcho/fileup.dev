import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useStorage } from '@vueuse/core';
import { fetchAuthMe } from '@common/api';
import type { AuthUser } from '@common/types';

export const useAuthStore = defineStore('auth', () => {
  const token = useStorage('auth_token', '');
  const user = ref<AuthUser | null>(null);
  let fetchUserPromise: Promise<void> | null = null;

  const login = (newToken: string) => {
    token.value = newToken;
    void fetchUser();
  };

  const logout = () => {
    token.value = '';
    user.value = null;
    fetchUserPromise = null;
  };

  const fetchUser = async () => {
    if (!token.value) {
      user.value = null;
      return;
    }

    if (fetchUserPromise) {
      return fetchUserPromise;
    }

    fetchUserPromise = (async () => {
      try {
        const response = await fetchAuthMe();
        user.value = response.data;
      } catch (error) {
        console.error('Fetch user failed:', error);
        if ((error as { response?: { status?: number } }).response?.status === 401) {
          logout();
        }
      } finally {
        fetchUserPromise = null;
      }
    })();

    return fetchUserPromise;
  };

  return { token, user, login, logout, fetchUser };
});
