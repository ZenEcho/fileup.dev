
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useStorage } from '@vueuse/core';
import api from '@common/services/api';

export const useAuthStore = defineStore('auth', () => {
  const token = useStorage('auth_token', '');
  const user = ref<any>(null);
  let fetchUserPromise: Promise<any> | null = null;

  const login = (newToken: string) => {
    token.value = newToken;
    fetchUser();
  };

  const logout = () => {
    token.value = '';
    user.value = null;
    fetchUserPromise = null;
  };

  const fetchUser = async () => {
    if (!token.value) return;
    
    // Return existing promise if request is in flight
    if (fetchUserPromise) return fetchUserPromise;

    try {
      fetchUserPromise = api.get('/auth/me');
      const response = await fetchUserPromise;
      user.value = response.data;
    } catch (error) {
      console.error('Fetch user failed:', error);
      // Don't logout immediately on network errors, only on 401
      if ((error as any).response?.status === 401) {
        logout();
      }
    } finally {
      fetchUserPromise = null;
    }
  };

  return { token, user, login, logout, fetchUser };
});
