<template>
  <div class="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
    <NCard class="w-full max-w-520px rounded-2xl border border-slate-200 shadow-lg">
      <div class="text-center mb-5">
        <h1 class="text-1.75rem font-700 text-slate-800">{{ t('auth.verifyTitle') }}</h1>
        <p class="text-slate-500 mt-2">{{ t('auth.verifySubtitle') }}</p>
      </div>

      <NAlert
        v-if="statusMessage"
        :type="statusType"
        class="mb-4"
        :title="statusMessage"
      />

      <div class="flex flex-col gap-4">
        <label class="text-0.9rem text-slate-600 font-600">{{ t('auth.emailLabel') }}</label>
        <NInput
          v-model:value="email"
          :placeholder="t('auth.emailPlaceholder')"
          clearable
        />

        <label class="text-0.9rem text-slate-600 font-600">{{ t('auth.verifyCodeLabel') }}</label>
        <NInput
          v-model:value="code"
          :placeholder="t('auth.verifyCodePlaceholder')"
          clearable
          maxlength="6"
          @keyup.enter="verifyByCodeAction"
        />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <NButton type="primary" :loading="verifyLoading" @click="verifyByCodeAction">
            {{ t('auth.verifyByCodeSubmit') }}
          </NButton>
          <NButton secondary :loading="resendLoading" @click="resendAction">
            {{ t('auth.resendVerify') }}
          </NButton>
        </div>

        <NButton quaternary @click="goLogin">
          {{ t('auth.loginNow') }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { NAlert, NButton, NCard, NInput, useMessage } from 'naive-ui';
import {
  resendEmailVerification,
  verifyEmailByCode,
  verifyEmailByToken,
  type VerifyEmailResponse,
} from '@common/api';
import { useAuthStore } from '@common/stores/auth';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();
const { t } = useI18n();

const email = ref('');
const code = ref('');
const verifyLoading = ref(false);
const resendLoading = ref(false);
const statusMessage = ref('');
const statusType = ref<'success' | 'warning' | 'error'>('warning');

const nextPath = computed(() => {
  const next = route.query.next;
  if (typeof next === 'string' && next.startsWith('/')) {
    return next;
  }
  return '/dashboard';
});

const setStatus = (type: 'success' | 'warning' | 'error', messageText: string) => {
  statusType.value = type;
  statusMessage.value = messageText;
};

const extractServerMessage = (error: unknown) => {
  const messageValue = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(messageValue)) {
    return messageValue.join(' ');
  }
  if (typeof messageValue === 'string' && messageValue.trim()) {
    return messageValue;
  }
  return '';
};

const resolveVerifyErrorMessage = (error: unknown, fallback: string) => {
  const serverMessage = extractServerMessage(error).toLowerCase();

  if (serverMessage.includes('invalid or expired')) {
    return t('auth.verifyInvalidOrExpired');
  }

  if (
    serverMessage.includes('token is required') ||
    serverMessage.includes('format is invalid')
  ) {
    return t('auth.verifyCodeInvalidFormat');
  }

  if (serverMessage.includes('account is disabled')) {
    return t('auth.verifyAccountDisabled');
  }

  if (serverMessage.includes('user not found')) {
    return t('auth.verifyUserNotFound');
  }

  return fallback;
};

const resolveResendErrorMessage = (error: unknown, fallback: string) => {
  const serverMessage = extractServerMessage(error).toLowerCase();

  if (serverMessage.includes('please wait')) {
    return t('auth.verifyResendCooldown');
  }

  if (serverMessage.includes('email format is invalid')) {
    return t('auth.verifyEmailInvalid');
  }

  return fallback;
};

const completeVerification = async (payload: VerifyEmailResponse) => {
  if (!payload.access_token) {
    setStatus('warning', t('auth.verifyNeedLogin'));
    message.warning(t('auth.verifyNeedLogin'));
    goLogin();
    return;
  }

  authStore.login(payload.access_token);
  await authStore.fetchUser();

  setStatus('success', t('auth.verifySuccess'));
  message.success(t('auth.verifySuccess'));

  await router.replace(nextPath.value);
};

const verifyByTokenAction = async (token: string) => {
  verifyLoading.value = true;
  try {
    const response = await verifyEmailByToken(token);
    await completeVerification(response.data);
  } catch (error) {
    setStatus('error', resolveVerifyErrorMessage(error, t('auth.verifyFailed')));
  } finally {
    verifyLoading.value = false;
  }
};

const verifyByCodeAction = async () => {
  if (!email.value.trim() || !code.value.trim()) {
    message.warning(t('auth.verifyCodeRequired'));
    return;
  }

  verifyLoading.value = true;
  try {
    const response = await verifyEmailByCode({
      email: email.value.trim(),
      code: code.value.trim(),
    });

    await completeVerification(response.data);
  } catch (error) {
    setStatus('error', resolveVerifyErrorMessage(error, t('auth.verifyFailed')));
  } finally {
    verifyLoading.value = false;
  }
};

const resendAction = async () => {
  if (!email.value.trim()) {
    message.warning(t('auth.verifyResendNeedEmail'));
    return;
  }

  resendLoading.value = true;
  try {
    const response = await resendEmailVerification(email.value.trim());

    if (response.data.resent) {
      setStatus('warning', t('auth.verifyEmailSent'));
      message.success(t('auth.verifyEmailSent'));
    } else if (response.data.reason === 'MAIL_DISABLED') {
      setStatus('warning', t('auth.mailVerificationDisabled'));
      message.info(t('auth.mailVerificationDisabled'));
    } else {
      setStatus('warning', t('auth.verificationNotRequired'));
      message.info(t('auth.verificationNotRequired'));
    }
  } catch (error) {
    setStatus('error', resolveResendErrorMessage(error, t('auth.verifyResendFailed')));
  } finally {
    resendLoading.value = false;
  }
};

const goLogin = () => {
  router.push({
    path: '/login',
    query: {
      email: email.value.trim() || undefined,
      next: nextPath.value,
    },
  });
};

onMounted(() => {
  const queryEmail = route.query.email;
  if (typeof queryEmail === 'string') {
    email.value = queryEmail;
  }

  const maskedEmail = route.query.masked;
  if (typeof maskedEmail === 'string' && maskedEmail) {
    setStatus('warning', t('auth.verifyEmailSentMasked', { email: maskedEmail }));
  }

  const token = route.query.token;
  if (typeof token === 'string' && token.trim()) {
    void verifyByTokenAction(token);
  }
});
</script>

