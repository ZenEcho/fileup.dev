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
import { useAuthStore } from '@common/stores/auth';
import { getGithubCallbackUrl, getGoogleCallbackUrl } from '@common/api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const resolveProvider = () => {
  const providerQuery = route.query.provider;
  if (providerQuery === 'google') {
    return 'google';
  }

  if (route.path.includes('/google/')) {
    return 'google';
  }

  return 'github';
};

const redirectToLoginWithOAuthError = async (
  provider: 'github' | 'google',
  reason: string,
  next?: string,
) => {
  const query = new URLSearchParams({
    oauthError: reason,
    provider,
  });

  if (next) {
    query.set('next', next);
  }

  await router.replace('/login?' + query.toString());
};

onMounted(async () => {
  const token = route.query.token as string | undefined;
  const code = route.query.code as string | undefined;
  const bind = route.query.bind as string | undefined;
  const oauth = route.query.oauth as string | undefined;
  const reason = route.query.reason as string | undefined;
  const state = route.query.state as string | undefined;
  const provider = resolveProvider();

  if (oauth === 'error') {
    const errorReason = reason?.trim() || 'UNKNOWN_ERROR';

    if (errorReason === 'USER_OAUTH_UNBOUND_REBIND_REQUIRED') {
      if (authStore.token) {
        try {
          await authStore.fetchUser();
        } catch {
          // ignore and fallback to login redirect.
        }

        if (authStore.user) {
          const query = new URLSearchParams({
            oauthBind: 'error',
            provider,
            reason: errorReason,
          });

          await router.replace('/dashboard/security?' + query.toString());
          return;
        }
      }

      await redirectToLoginWithOAuthError(provider, errorReason, '/dashboard/security');
      return;
    }

    await redirectToLoginWithOAuthError(provider, errorReason);
    return;
  }

  if (token) {
    authStore.login(token);
    await authStore.fetchUser();
    await router.replace('/dashboard');
    return;
  }

  if (bind) {
    await authStore.fetchUser();

    const query = new URLSearchParams({
      oauthBind: bind,
      provider,
    });

    if (reason) {
      query.set('reason', reason);
    }

    await router.replace('/dashboard/security?' + query.toString());
    return;
  }

  if (code) {
    window.location.href =
      provider === 'google'
        ? getGoogleCallbackUrl(code, state)
        : getGithubCallbackUrl(code, state);
    return;
  }

  await router.replace('/');
});
</script>
