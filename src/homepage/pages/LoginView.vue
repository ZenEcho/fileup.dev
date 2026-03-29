<template>
  <div class="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
    <NCard class="w-full max-w-460px rounded-2xl border border-slate-200 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div class="text-center mb-6">
        <h1 class="text-1.75rem font-700 text-slate-800 dark:text-slate-100">{{ t('auth.loginTitle') }}</h1>
        <p class="text-slate-500 mt-2 dark:text-slate-400">{{ t('auth.loginSubtitle') }}</p>
      </div>

      <div class="flex flex-col gap-4">
        <label class="text-0.9rem text-slate-600 font-600 dark:text-slate-300">{{ t('auth.identifierLabel') }}</label>
        <NInput
          v-model:value="identifier"
          :placeholder="t('auth.identifierPlaceholder')"
          clearable
          @keyup.enter="submitLogin"
        />

        <label class="text-0.9rem text-slate-600 font-600 dark:text-slate-300">{{ t('auth.passwordLabel') }}</label>
        <NInput
          v-model:value="password"
          type="password"
          :input-props="{ autocomplete: 'current-password' }"
          :placeholder="t('auth.passwordPlaceholder')"
          show-password-on="click"
          @keyup.enter="submitLogin"
        />

        <template v-if="isCaptchaRequired">
          <label class="text-0.9rem text-slate-600 font-600 dark:text-slate-300">{{ t('auth.captchaLabel') }}</label>
          <CaptchaChallenge
            ref="captchaRef"
            v-model="captchaToken"
            :enabled="isCaptchaRequired"
            :provider="captchaProvider"
            :site-key="captchaPolicy?.siteKey || null"
          />
          <p class="text-0.8rem text-slate-500 dark:text-slate-400">
            {{ t('auth.captchaHint', { provider: captchaProvider }) }}
          </p>
        </template>

        <NButton type="primary" size="large" :loading="loading" @click="submitLogin">
          {{ t('auth.loginSubmit') }}
        </NButton>

        <NButton
          v-if="showResendVerify"
          tertiary
          type="warning"
          :loading="resendLoading"
          @click="resendVerification"
        >
          {{ t('auth.resendVerify') }}
        </NButton>
      </div>

      <NDivider>{{ t('auth.or') }}</NDivider>

      <div class="grid grid-cols-1 gap-3">
        <NButton secondary block size="large" @click="redirectToGithub">
          <template #icon>
            <div class="i-ph-github-logo-fill" />
          </template>
          {{ t('auth.githubLogin') }}
        </NButton>

        <NButton secondary block size="large" @click="redirectToGoogle">
          <template #icon>
            <div class="i-ph-google-logo-fill" />
          </template>
          {{ t('auth.googleLogin') }}
        </NButton>
      </div>

      <div class="text-center mt-5 text-0.9rem text-slate-500 dark:text-slate-400">
        <span>{{ t('auth.noAccount') }}</span>
        <NButton text type="primary" class="ml-1" @click="goRegister">
          {{ t('auth.registerNow') }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NDivider, NInput, useMessage } from 'naive-ui';
import {
  fetchCaptchaPolicy,
  getGithubAuthUrl,
  getGoogleAuthUrl,
  loginWithPassword,
  resendEmailVerification,
  type CaptchaPolicy,
} from '@common/api';
import { useAuthStore } from '@common/stores/auth';
import CaptchaChallenge from '@common/components/CaptchaChallenge.vue';

interface CaptchaChallengeRef {
  reset: () => void;
}

const route = useRoute();
const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();
const { t } = useI18n();

const identifier = ref('');
const password = ref('');
const captchaToken = ref('');
const loading = ref(false);
const resendLoading = ref(false);
const showResendVerify = ref(false);
const captchaPolicy = ref<CaptchaPolicy | null>(null);
const captchaRef = ref<CaptchaChallengeRef | null>(null);

const nextPath = computed(() => {
  const next = route.query.next;
  if (typeof next === 'string' && next.startsWith('/')) {
    return next;
  }
  return '/dashboard';
});

const isCaptchaRequired = computed(() => {
  return Boolean(captchaPolicy.value?.enabled && captchaPolicy.value?.loginEnabled);
});

const captchaProvider = computed<CaptchaPolicy['provider']>(() => {
  return captchaPolicy.value?.provider || 'TURNSTILE';
});

const resolveErrorMessage = (error: unknown, fallback: string) => {
  const messageValue = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(messageValue)) {
    return messageValue.join(' ');
  }
  if (typeof messageValue === 'string' && messageValue.trim()) {
    return messageValue;
  }
  return fallback;
};

const resolveOAuthLoginErrorMessage = (reason: string) => {
  const normalized = reason.trim();
  if (!normalized) {
    return t('auth.oauthLoginFailed');
  }

  if (normalized === 'USER_OAUTH_UNBOUND_REBIND_REQUIRED') {
    return t('auth.oauthUnboundRebindRequired');
  }

  return `${t('auth.oauthLoginFailed')} (${normalized})`;
};

const ensureAuthState = async () => {
  if (!authStore.token) {
    return;
  }

  if (!authStore.user) {
    await authStore.fetchUser();
  }

  if (authStore.user) {
    await router.replace(nextPath.value);
  }
};

const loadCaptchaPolicy = async () => {
  try {
    const response = await fetchCaptchaPolicy();
    captchaPolicy.value = response.data;
  } catch (error) {
    console.error('Failed to load captcha policy', error);
    captchaPolicy.value = null;
  }
};

const submitLogin = async () => {
  if (loading.value) {
    return;
  }

  showResendVerify.value = false;

  if (!identifier.value.trim() || !password.value) {
    message.warning(t('auth.loginRequired'));
    return;
  }

  if (isCaptchaRequired.value && !captchaToken.value.trim()) {
    message.warning(t('auth.captchaRequired'));
    return;
  }

  loading.value = true;
  try {
    const response = await loginWithPassword({
      identifier: identifier.value.trim(),
      password: password.value,
      captchaToken: captchaToken.value.trim() || undefined,
    });

    authStore.login(response.data.access_token);
    message.success(t('auth.loginSuccess'));
    await router.push(nextPath.value);
  } catch (error) {
    const errorMessage = resolveErrorMessage(error, t('auth.loginFailed'));
    message.error(errorMessage);

    if (isCaptchaRequired.value) {
      captchaRef.value?.reset();
    }

    if (errorMessage.toLowerCase().includes('not verified')) {
      showResendVerify.value = true;
    }
  } finally {
    loading.value = false;
  }
};

const resendVerification = async () => {
  const target = identifier.value.trim();
  if (!target.includes('@')) {
    message.warning(t('auth.verifyResendNeedEmail'));
    return;
  }

  resendLoading.value = true;
  try {
    const response = await resendEmailVerification(target);

    if (response.data.resent) {
      message.success(t('auth.verifyEmailSent'));
    } else if (response.data.reason === 'MAIL_DISABLED') {
      message.info(t('auth.mailVerificationDisabled'));
    } else {
      message.info(t('auth.verificationNotRequired'));
    }
  } catch (error) {
    message.error(resolveErrorMessage(error, t('auth.verifyResendFailed')));
  } finally {
    resendLoading.value = false;
  }
};

const redirectToGithub = () => {
  window.location.href = getGithubAuthUrl();
};

const redirectToGoogle = () => {
  window.location.href = getGoogleAuthUrl();
};

const goRegister = () => {
  router.push({
    path: '/register',
    query: {
      next: nextPath.value,
    },
  });
};

watch(isCaptchaRequired, (enabled) => {
  if (!enabled) {
    captchaToken.value = '';
  }
});

onMounted(() => {
  const queryEmail = route.query.email;
  if (typeof queryEmail === 'string' && queryEmail.includes('@')) {
    identifier.value = queryEmail;
  }

  const oauthError = route.query.oauthError;
  if (typeof oauthError === 'string' && oauthError.trim()) {
    message.error(resolveOAuthLoginErrorMessage(oauthError));
  }

  void ensureAuthState();
  void loadCaptchaPolicy();
});
</script>

