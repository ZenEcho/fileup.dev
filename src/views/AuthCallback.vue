
<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h2 class="text-xl mb-4">{{ t('auth.processing') }}</h2>
      <div class="animate-spin text-4xl">⌛</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import { API_BASE_URL } from '../api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

onMounted(() => {
  const token = route.query.token as string;
  const code = route.query.code as string;
  
  console.log('AuthCallback mounted', { token, code });

  if (token) {
    authStore.login(token);
    // Give it a moment to sync
    setTimeout(() => {
      router.push('/dashboard');
    }, 100);
  } else if (code) {
    // If we have a code but no token, it means we landed here directly from GitHub
    // We need to forward this code to the backend to complete the flow
    window.location.href = `${API_BASE_URL}/auth/github/callback?code=${code}`;
  } else {
    console.error('No token or code found in URL');
    router.push('/'); 
  }
});
</script>
