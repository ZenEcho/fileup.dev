<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NInput,
  NPopconfirm,
  NTag,
  useMessage,
} from 'naive-ui';
import {
  changeMyPassword,
  createGithubBindAuthorization,
  createGoogleBindAuthorization,
  fetchMyProfile,
  requestMyEmailChange,
  requestMyLocalBind,
  resendMyEmailChangeVerification,
  resendMyLocalBindVerification,
  resendMyVerification,
  unbindMyOAuthProvider,
  type ChangeMyPasswordPayload,
  type MyProfile,
} from '@common/api';
import { useDateFormat } from '@common/composables';
import { useAuthStore } from '@common/stores/auth';
import EmailVerificationCard from '@frontend/components/account/EmailVerificationCard.vue';
import PasswordChangeForm from '@frontend/components/account/PasswordChangeForm.vue';

interface PasswordFormRef {
  reset: () => void;
}

type LoginSource = 'LOCAL' | 'GITHUB' | 'GOOGLE';
type OAuthProvider = 'GITHUB' | 'GOOGLE';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();
const { formatDateTime } = useDateFormat();

const loading = ref(false);
const passwordLoading = ref(false);
const resendLoading = ref(false);
const emailChangeLoading = ref(false);
const emailChangeResendLoading = ref(false);
const githubBindLoading = ref(false);
const googleBindLoading = ref(false);
const githubUnbindLoading = ref(false);
const googleUnbindLoading = ref(false);
const localBindLoading = ref(false);
const localBindResendLoading = ref(false);

const profile = ref<MyProfile | null>(null);
const passwordFormRef = ref<PasswordFormRef | null>(null);

const emailChangeForm = reactive({
  email: '',
});

const localBindForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
});

const authProviders = computed<LoginSource[]>(() => {
  if (!profile.value) {
    return [];
  }

  if (Array.isArray(profile.value.authProviders) && profile.value.authProviders.length > 0) {
    return profile.value.authProviders;
  }

  if (profile.value.authProvider && profile.value.authProvider !== 'MIXED') {
    return [profile.value.authProvider as LoginSource];
  }

  return profile.value.hasPassword ? ['LOCAL'] : [];
});

const providerLabel = (provider: LoginSource) => {
  return t(`account.authProviderLabel.${provider}`);
};

const hasLocalAuth = computed(() => authProviders.value.includes('LOCAL'));
const hasGithubAuth = computed(() => authProviders.value.includes('GITHUB'));
const hasGoogleAuth = computed(() => authProviders.value.includes('GOOGLE'));
const hasMultipleAuthProviders = computed(() => authProviders.value.length > 1);

const canBindGithub = computed(() => hasLocalAuth.value && !hasGithubAuth.value);
const canBindGoogle = computed(() => hasLocalAuth.value && !hasGoogleAuth.value);
const canUnbindGithub = computed(() => hasGithubAuth.value && hasMultipleAuthProviders.value);
const canUnbindGoogle = computed(() => hasGoogleAuth.value && hasMultipleAuthProviders.value);
const isOauthOnly = computed(
  () => !profile.value?.hasPassword && (hasGithubAuth.value || hasGoogleAuth.value),
);
const canChangePassword = computed(() => Boolean(profile.value?.hasPassword));

const hasPendingEmailChange = computed(() => {
  return (
    profile.value?.pendingEmailPurpose === 'EMAIL_CHANGE' &&
    Boolean(profile.value.pendingEmail)
  );
});

const hasPendingLocalBind = computed(() => {
  return (
    profile.value?.pendingEmailPurpose === 'LOCAL_BIND' &&
    Boolean(profile.value.pendingEmail)
  );
});

const loadProfile = async () => {
  loading.value = true;
  try {
    const response = await fetchMyProfile();
    profile.value = response.data;

    if (!emailChangeForm.email) {
      emailChangeForm.email = response.data.pendingEmail || '';
    }

    if (!localBindForm.email) {
      localBindForm.email = response.data.pendingEmail || '';
    }
  } catch (error) {
    console.error('load security profile failed', error);
    message.error(t('account.security.loadFailed'));
  } finally {
    loading.value = false;
  }
};

const resolveErrorCode = (error: unknown) => {
  const messageValue = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(messageValue)) {
    return (messageValue[0] || '').trim();
  }

  if (typeof messageValue === 'string') {
    return messageValue.trim();
  }

  return '';
};

const resolveUnbindErrorMessage = (provider: OAuthProvider, error: unknown) => {
  const code = resolveErrorCode(error);

  if (code === 'USER_LOGIN_METHOD_LAST_ONE') {
    return t('account.security.oauthUnbindLastMethodForbidden');
  }

  if (code === 'USER_OAUTH_PROVIDER_NOT_BOUND') {
    return t('account.security.oauthProviderNotBound');
  }

  if (code === 'USER_OAUTH_PROVIDER_INVALID') {
    return t('account.security.oauthProviderInvalid');
  }

  if (code) {
    return provider === 'GOOGLE'
      ? `${t('account.security.googleUnbindFailed')} (${code})`
      : `${t('account.security.githubUnbindFailed')} (${code})`;
  }

  return provider === 'GOOGLE'
    ? t('account.security.googleUnbindFailed')
    : t('account.security.githubUnbindFailed');
};

const onPasswordSubmit = async (payload: ChangeMyPasswordPayload) => {
  if (passwordLoading.value) {
    return;
  }

  passwordLoading.value = true;
  try {
    await changeMyPassword(payload);
    message.success(t('account.security.passwordUpdated'));
    passwordFormRef.value?.reset();
    await loadProfile();
    await authStore.fetchUser();
  } catch (error) {
    console.error('change password failed', error);
    message.error(t('account.security.passwordUpdateFailed'));
  } finally {
    passwordLoading.value = false;
  }
};

const resend = async () => {
  if (resendLoading.value) {
    return;
  }

  resendLoading.value = true;
  try {
    const response = await resendMyVerification();

    if (response.data.resent) {
      message.success(t('account.security.resendSuccess'));
    } else if (response.data.reason === 'MAIL_DISABLED') {
      message.info(t('account.security.mailVerificationDisabled'));
    } else {
      message.info(t('account.security.verificationNotRequired'));
    }
  } catch (error) {
    console.error('resend verification failed', error);
    message.error(t('account.security.resendFailed'));
  } finally {
    resendLoading.value = false;
  }
};

const submitEmailChange = async () => {
  if (emailChangeLoading.value) {
    return;
  }

  if (!emailChangeForm.email.trim()) {
    message.warning(t('account.security.newEmailRequired'));
    return;
  }

  emailChangeLoading.value = true;
  try {
    await requestMyEmailChange({
      email: emailChangeForm.email.trim(),
    });
    message.success(t('account.security.emailChangeRequested'));
    await loadProfile();
  } catch (error) {
    console.error('request email change failed', error);
    message.error(t('account.security.emailChangeRequestFailed'));
  } finally {
    emailChangeLoading.value = false;
  }
};

const resendEmailChange = async () => {
  if (emailChangeResendLoading.value) {
    return;
  }

  emailChangeResendLoading.value = true;
  try {
    await resendMyEmailChangeVerification();
    message.success(t('account.security.emailChangeResendSuccess'));
  } catch (error) {
    console.error('resend email change verify failed', error);
    message.error(t('account.security.emailChangeResendFailed'));
  } finally {
    emailChangeResendLoading.value = false;
  }
};

const bindGithub = async () => {
  if (githubBindLoading.value) {
    return;
  }

  githubBindLoading.value = true;
  try {
    const response = await createGithubBindAuthorization();
    window.location.href = response.data.authorizeUrl;
  } catch (error) {
    console.error('create github bind auth failed', error);
    message.error(t('account.security.githubBindFailed'));
  } finally {
    githubBindLoading.value = false;
  }
};

const bindGoogle = async () => {
  if (googleBindLoading.value) {
    return;
  }

  googleBindLoading.value = true;
  try {
    const response = await createGoogleBindAuthorization();
    window.location.href = response.data.authorizeUrl;
  } catch (error) {
    console.error('create google bind auth failed', error);
    message.error(t('account.security.googleBindFailed'));
  } finally {
    googleBindLoading.value = false;
  }
};

const unbindGithub = async () => {
  if (githubUnbindLoading.value) {
    return;
  }

  githubUnbindLoading.value = true;
  try {
    await unbindMyOAuthProvider('github');
    message.success(t('account.security.githubUnbindSuccess'));
    await loadProfile();
    await authStore.fetchUser();
  } catch (error) {
    console.error('unbind github failed', error);
    message.error(resolveUnbindErrorMessage('GITHUB', error));
  } finally {
    githubUnbindLoading.value = false;
  }
};

const unbindGoogle = async () => {
  if (googleUnbindLoading.value) {
    return;
  }

  googleUnbindLoading.value = true;
  try {
    await unbindMyOAuthProvider('google');
    message.success(t('account.security.googleUnbindSuccess'));
    await loadProfile();
    await authStore.fetchUser();
  } catch (error) {
    console.error('unbind google failed', error);
    message.error(resolveUnbindErrorMessage('GOOGLE', error));
  } finally {
    googleUnbindLoading.value = false;
  }
};

const scrollToLocalBind = () => {
  const target = document.getElementById('local-bind-card');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const submitLocalBind = async () => {
  if (localBindLoading.value) {
    return;
  }

  if (!localBindForm.email.trim() || !localBindForm.password || !localBindForm.confirmPassword) {
    message.warning(t('account.security.localBindRequired'));
    return;
  }

  if (localBindForm.password !== localBindForm.confirmPassword) {
    message.warning(t('account.security.passwordMismatch'));
    return;
  }

  localBindLoading.value = true;
  try {
    await requestMyLocalBind({
      email: localBindForm.email.trim(),
      password: localBindForm.password,
      confirmPassword: localBindForm.confirmPassword,
    });

    localBindForm.password = '';
    localBindForm.confirmPassword = '';

    message.success(t('account.security.localBindRequested'));
    await loadProfile();
  } catch (error) {
    console.error('request local bind failed', error);
    message.error(t('account.security.localBindRequestFailed'));
  } finally {
    localBindLoading.value = false;
  }
};

const resendLocalBind = async () => {
  if (localBindResendLoading.value) {
    return;
  }

  localBindResendLoading.value = true;
  try {
    await resendMyLocalBindVerification();
    message.success(t('account.security.localBindResendSuccess'));
  } catch (error) {
    console.error('resend local bind failed', error);
    message.error(t('account.security.localBindResendFailed'));
  } finally {
    localBindResendLoading.value = false;
  }
};

const resolveBindCallbackErrorMessage = (
  provider: 'github' | 'google',
  reason: string,
) => {
  if (reason === 'USER_OAUTH_UNBOUND_REBIND_REQUIRED') {
    return t('auth.oauthUnboundRebindRequired');
  }

  const text =
    provider === 'google'
      ? t('account.security.googleBindFailed')
      : t('account.security.githubBindFailed');

  if (!reason) {
    return text;
  }

  return `${text} (${reason})`;
};

const handleOauthBindCallbackHint = async () => {
  const bind =
    (typeof route.query.oauthBind === 'string' && route.query.oauthBind) ||
    (typeof route.query.githubBind === 'string' && route.query.githubBind) ||
    '';

  if (!bind) {
    return;
  }

  const provider =
    typeof route.query.provider === 'string' && route.query.provider.toLowerCase() === 'google'
      ? 'google'
      : 'github';

  if (bind === 'success') {
    message.success(
      provider === 'google'
        ? t('account.security.googleBindSuccess')
        : t('account.security.githubBindSuccess'),
    );
  } else {
    const reason = typeof route.query.reason === 'string' ? route.query.reason : '';
    message.error(resolveBindCallbackErrorMessage(provider, reason));
  }

  await router.replace('/dashboard/security');
};

onMounted(async () => {
  if (!authStore.token) {
    await router.push('/login?next=/dashboard/security');
    return;
  }

  await loadProfile();
  await handleOauthBindCallbackHint();
});
</script>

<template>
  <div class="pt-25 pb-16 container-custom min-h-screen flex flex-col gap-6">
    <NCard>
      <h1 class="text-2xl font-bold m-0">{{ t('account.security.title') }}</h1>
      <p class="text-text-secondary mt-1 mb-0">{{ t('account.security.subtitle') }}</p>
    </NCard>

    <NCard :loading="loading">
      <NDescriptions bordered :column="2">
        <NDescriptionsItem :label="t('account.security.accountStatus')">
          <NTag :type="profile?.status === 'ACTIVE' ? 'success' : profile?.status === 'PENDING' ? 'warning' : 'error'">
            {{ t(`account.status.${profile?.status || 'ACTIVE'}`) }}
          </NTag>
        </NDescriptionsItem>

        <NDescriptionsItem :label="t('account.security.authProvider')">
          <div class="flex flex-wrap gap-2">
            <NTag v-for="provider in authProviders" :key="provider" size="small" round>
              {{ providerLabel(provider) }}
            </NTag>
            <span v-if="authProviders.length <= 0">-</span>
          </div>
        </NDescriptionsItem>

        <NDescriptionsItem :label="t('account.security.lastLoginAt')">
          {{ formatDateTime(profile?.lastLoginAt || null) }}
        </NDescriptionsItem>

        <NDescriptionsItem :label="t('account.security.passwordUpdatedAt')">
          {{ formatDateTime(profile?.passwordUpdatedAt || null) }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard size="small" :title="t('account.security.loginMethodsTitle')">
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ providerLabel('LOCAL') }}</span>
            <NTag size="small" :type="hasLocalAuth ? 'success' : 'default'" round>
              {{ hasLocalAuth ? t('account.security.providerBound') : t('account.security.providerUnbound') }}
            </NTag>
          </div>
          <NButton v-if="!hasLocalAuth" type="primary" secondary @click="scrollToLocalBind">
            {{ t('account.security.localBindSubmit') }}
          </NButton>
          <NButton v-else disabled secondary>
            {{ t('account.security.providerBound') }}
          </NButton>
        </div>

        <div class="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ providerLabel('GITHUB') }}</span>
            <NTag size="small" :type="hasGithubAuth ? 'success' : 'default'" round>
              {{ hasGithubAuth ? t('account.security.providerBound') : t('account.security.providerUnbound') }}
            </NTag>
          </div>
          <NPopconfirm v-if="hasGithubAuth" @positive-click="unbindGithub">
            <template #trigger>
              <NButton type="error" secondary :loading="githubUnbindLoading" :disabled="!canUnbindGithub">
                {{ t('account.security.unbindAction') }}
              </NButton>
            </template>
            {{ t('account.security.githubUnbindConfirm') }}
          </NPopconfirm>
          <NButton
            v-else
            type="primary"
            secondary
            :loading="githubBindLoading"
            :disabled="!canBindGithub"
            @click="bindGithub"
          >
            {{ t('account.security.bindAction') }}
          </NButton>
        </div>

        <div class="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ providerLabel('GOOGLE') }}</span>
            <NTag size="small" :type="hasGoogleAuth ? 'success' : 'default'" round>
              {{ hasGoogleAuth ? t('account.security.providerBound') : t('account.security.providerUnbound') }}
            </NTag>
          </div>
          <NPopconfirm v-if="hasGoogleAuth" @positive-click="unbindGoogle">
            <template #trigger>
              <NButton type="error" secondary :loading="googleUnbindLoading" :disabled="!canUnbindGoogle">
                {{ t('account.security.unbindAction') }}
              </NButton>
            </template>
            {{ t('account.security.googleUnbindConfirm') }}
          </NPopconfirm>
          <NButton
            v-else
            type="primary"
            secondary
            :loading="googleBindLoading"
            :disabled="!canBindGoogle"
            @click="bindGoogle"
          >
            {{ t('account.security.bindAction') }}
          </NButton>
        </div>
      </div>
    </NCard>

    <EmailVerificationCard
      :email="profile?.email || null"
      :email-verified="Boolean(profile?.emailVerified)"
      :mail-enabled="Boolean(profile?.mailEnabled)"
      :verification-required-now="Boolean(profile?.verificationRequiredNow)"
      :loading="resendLoading"
      @resend="resend"
    />

    <NCard size="small" :title="t('account.security.emailChangeTitle')">
      <p class="text-sm text-text-secondary mt-0 mb-4">{{ t('account.security.emailChangeDesc') }}</p>

      <NForm label-placement="top" class="grid grid-cols-1 gap-3">
        <NFormItem :label="t('account.security.newEmail')">
          <NInput v-model:value="emailChangeForm.email" :placeholder="t('account.security.newEmailPlaceholder')" />
        </NFormItem>

        <div v-if="hasPendingEmailChange" class="text-xs text-text-secondary">
          {{ t('account.security.pendingEmailTip', { email: profile?.pendingEmail || '-' }) }}
        </div>

        <div class="flex justify-end gap-2">
          <NButton secondary :loading="emailChangeResendLoading" :disabled="!hasPendingEmailChange" @click="resendEmailChange">
            {{ t('account.security.emailChangeResend') }}
          </NButton>
          <NButton type="primary" :loading="emailChangeLoading" @click="submitEmailChange">
            {{ t('account.security.emailChangeSubmit') }}
          </NButton>
        </div>
      </NForm>
    </NCard>


    <NCard id="local-bind-card" v-if="isOauthOnly" size="small" :title="t('account.security.localBindTitle')">
      <p class="text-sm text-text-secondary mt-0 mb-4">{{ t('account.security.localBindDesc') }}</p>
      <NForm label-placement="top" class="grid grid-cols-1 gap-3">
        <NFormItem :label="t('account.security.newEmail')">
          <NInput v-model:value="localBindForm.email" :placeholder="t('account.security.newEmailPlaceholder')" />
        </NFormItem>

        <NFormItem :label="t('account.security.newPassword')">
          <NInput
            v-model:value="localBindForm.password"
            type="password"
            show-password-on="click"
            :input-props="{ autocomplete: 'new-password' }"
            :placeholder="t('account.security.newPasswordPlaceholder')"
          />
        </NFormItem>

        <NFormItem :label="t('account.security.confirmNewPassword')">
          <NInput
            v-model:value="localBindForm.confirmPassword"
            type="password"
            show-password-on="click"
            :input-props="{ autocomplete: 'new-password' }"
            :placeholder="t('account.security.confirmNewPasswordPlaceholder')"
          />
        </NFormItem>

        <div v-if="hasPendingLocalBind" class="text-xs text-text-secondary">
          {{ t('account.security.pendingEmailTip', { email: profile?.pendingEmail || '-' }) }}
        </div>

        <div class="flex justify-end gap-2">
          <NButton secondary :loading="localBindResendLoading" :disabled="!hasPendingLocalBind" @click="resendLocalBind">
            {{ t('account.security.localBindResend') }}
          </NButton>
          <NButton type="primary" :loading="localBindLoading" @click="submitLocalBind">
            {{ t('account.security.localBindSubmit') }}
          </NButton>
        </div>
      </NForm>
    </NCard>

    <PasswordChangeForm
      v-if="canChangePassword"
      ref="passwordFormRef"
      :has-password="Boolean(profile?.hasPassword)"
      :loading="passwordLoading"
      @submit="onPasswordSubmit"
    />
  </div>
</template>
