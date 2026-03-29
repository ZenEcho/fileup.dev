<template>
  <div class="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
    <NCard class="w-full max-w-460px rounded-2xl border border-slate-200 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div class="text-center mb-6">
        <h1 class="text-1.75rem font-700 text-slate-800 dark:text-slate-100">{{ t('auth.resetPasswordTitle') }}</h1>
        <p class="text-slate-500 mt-2 dark:text-slate-400">{{ t('auth.resetPasswordSubtitle') }}</p>
      </div>

      <div class="flex flex-col gap-4">
        <label class="text-0.9rem text-slate-600 font-600 dark:text-slate-300">{{ t('auth.newPasswordLabel') }}</label>
        <NInput
          v-model:value="newPassword"
          type="password"
          :input-props="{ autocomplete: 'new-password' }"
          :placeholder="t('auth.newPasswordPlaceholder')"
          show-password-on="click"
        />

        <label class="text-0.9rem text-slate-600 font-600 dark:text-slate-300">{{ t('auth.confirmPasswordLabel') }}</label>
        <NInput
          v-model:value="confirmNewPassword"
          type="password"
          :input-props="{ autocomplete: 'new-password' }"
          :placeholder="t('auth.confirmPasswordPlaceholder')"
          show-password-on="click"
          @keyup.enter="submit"
        />

        <NButton type="primary" :loading="loading" @click="submit">
          {{ t('auth.resetPasswordSubmit') }}
        </NButton>

        <NButton quaternary @click="goLogin">
          {{ t('auth.loginNow') }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NCard, NInput, useMessage } from 'naive-ui';
import { confirmPasswordReset } from '@common/api';

const route = useRoute();
const router = useRouter();
const message = useMessage();
const { t } = useI18n();

const loading = ref(false);
const newPassword = ref('');
const confirmNewPassword = ref('');

const token = computed(() => {
  const queryToken = route.query.token;
  return typeof queryToken === 'string' ? queryToken.trim() : '';
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

const submit = async () => {
  if (loading.value) {
    return;
  }

  if (!token.value) {
    message.error(t('auth.resetPasswordTokenMissing'));
    return;
  }

  if (!newPassword.value || !confirmNewPassword.value) {
    message.warning(t('auth.newPasswordRequired'));
    return;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    message.warning(t('auth.passwordMismatch'));
    return;
  }

  loading.value = true;
  try {
    await confirmPasswordReset({
      token: token.value,
      newPassword: newPassword.value,
      confirmNewPassword: confirmNewPassword.value,
    });

    message.success(t('auth.resetPasswordSuccess'));
    await router.replace('/login');
  } catch (error) {
    message.error(resolveErrorMessage(error, t('auth.resetPasswordFailed')));
  } finally {
    loading.value = false;
  }
};

const goLogin = () => {
  void router.push('/login');
};
</script>
