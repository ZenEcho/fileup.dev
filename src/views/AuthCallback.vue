
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

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

onMounted(() => {
  const token = route.query.token as string;
  console.log('AuthCallback mounted, token:', token);
  if (token) {
    authStore.login(token);
    // Give it a moment to sync
    setTimeout(() => {
      router.push('/');
    }, 100);
  } else {
    console.error('No token found in URL');
    router.push('/'); 
  }
});
</script>
