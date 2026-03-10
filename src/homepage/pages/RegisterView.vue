<template>
  <div class="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
    <NCard class="w-full max-w-460px rounded-2xl border border-slate-200 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div class="text-center mb-6">
        <h1 class="text-1.75rem font-700 text-slate-800 dark:text-slate-100">{{ t('auth.registerTitle') }}</h1>
        <p class="text-slate-500 mt-2 dark:text-slate-400">{{ t('auth.registerSubtitle') }}</p>
      </div>

      <div class="flex flex-col gap-4">
        <label class="text-0.9rem text-slate-600 font-600 dark:text-slate-300">{{ t('auth.usernameLabel') }}</label>
        <NInput
          v-model:value="username"
          :placeholder="t('auth.usernamePlaceholder')"
          clearable
          @keyup.enter="submitRegister"
        />

        <label class="text-0.9rem text-slate-600 font-600 dark:text-slate-300">{{ t('auth.emailLabel') }}</label>
        <NInput
          v-model:value="email"
          :placeholder="t('auth.emailPlaceholder')"
          clearable
          @keyup.enter="submitRegister"
        />

        <label class="text-0.9rem text-slate-600 font-600 dark:text-slate-300">{{ t('auth.passwordLabel') }}</label>
        <NInput
          v-model:value="password"
          type="password"
          :placeholder="t('auth.passwordPlaceholder')"
          show-password-on="click"
          @keyup.enter="submitRegister"
        />

        <label class="text-0.9rem text-slate-600 font-600 dark:text-slate-300">{{ t('auth.confirmPasswordLabel') }}</label>
        <NInput
          v-model:value="confirmPassword"
          type="password"
          :placeholder="t('auth.confirmPasswordPlaceholder')"
          show-password-on="click"
          @keyup.enter="submitRegister"
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

        <NButton type="primary" size="large" :loading="loading" @click="submitRegister">
          {{ t('auth.registerSubmit') }}
        </NButton>
      </div>

      <div class="text-center mt-5 text-0.9rem text-slate-500 dark:text-slate-400">
        <span>{{ t('auth.hasAccount') }}</span>
        <NButton text type="primary" class="ml-1" @click="goLogin">
          {{ t('auth.loginNow') }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NInput, useMessage } from 'naive-ui';
import {
  fetchCaptchaPolicy,
  registerWithPassword,
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

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const captchaToken = ref('');
const loading = ref(false);
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
  return Boolean(captchaPolicy.value?.enabled && captchaPolicy.value?.registerEnabled);
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

const submitRegister = async () => {
  if (loading.value) {
    return;
  }

  if (!username.value.trim() || !email.value.trim() || !password.value || !confirmPassword.value) {
    message.warning(t('auth.registerRequired'));
    return;
  }

  if (password.value !== confirmPassword.value) {
    message.warning(t('auth.passwordMismatch'));
    return;
  }

  if (isCaptchaRequired.value && !captchaToken.value.trim()) {
    message.warning(t('auth.captchaRequired'));
    return;
  }

  loading.value = true;
  try {
    const response = await registerWithPassword({
      username: username.value.trim(),
      email: email.value.trim(),
      password: password.value,
      captchaToken: captchaToken.value.trim(),
    });

    if (response.data.requiresEmailVerification) {
      message.success(t('auth.verifyEmailSent'));
      await router.push({
        path: '/auth/verify-email',
        query: {
          email: email.value.trim(),
          masked: response.data.email,
          next: nextPath.value,
        },
      });
      return;
    }

    message.success(t('auth.registerSuccessNoVerify'));
    await router.push({
      path: '/login',
      query: {
        email: email.value.trim(),
        next: nextPath.value,
      },
    });
  } catch (error) {
    message.error(resolveErrorMessage(error, t('auth.registerFailed')));
    if (isCaptchaRequired.value) {
      captchaRef.value?.reset();
    }
  } finally {
    loading.value = false;
  }
};

const goLogin = () => {
  router.push({
    path: '/login',
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
  void ensureAuthState();
  void loadCaptchaPolicy();
});
</script>

