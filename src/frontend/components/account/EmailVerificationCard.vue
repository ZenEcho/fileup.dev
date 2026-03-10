<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NAlert, NButton, NCard, NTag } from 'naive-ui';

const props = defineProps<{
  email: string | null;
  emailVerified: boolean;
  mailEnabled: boolean;
  verificationRequiredNow: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: 'resend'): void;
}>();

const { t } = useI18n();

const canResend = computed(() => {
  return Boolean(
    props.mailEnabled &&
      props.verificationRequiredNow &&
      props.email &&
      !props.emailVerified,
  );
});

const verificationTagType = computed(() => {
  if (!props.mailEnabled) {
    return 'default';
  }

  return props.emailVerified ? 'success' : 'warning';
});

const verificationTagText = computed(() => {
  if (!props.mailEnabled) {
    return t('account.security.verificationPolicyDisabledTag');
  }

  return props.emailVerified
    ? t('account.security.verified')
    : t('account.security.unverified');
});
</script>

<template>
  <NCard size="small" :title="t('account.security.emailVerification')">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
      <div class="text-sm text-text-secondary">
        {{ email || '-' }}
      </div>
      <NTag :type="verificationTagType" size="small" round>
        {{ verificationTagText }}
      </NTag>
    </div>

    <NAlert
      v-if="!email"
      type="warning"
      :title="t('account.security.noEmailBound')"
      class="mb-3"
    />

    <NAlert
      v-else-if="!mailEnabled"
      type="info"
      :title="t('account.security.mailVerificationDisabled')"
      class="mb-3"
    />

    <NAlert
      v-else-if="!verificationRequiredNow"
      type="info"
      :title="t('account.security.verificationNotRequired')"
      class="mb-3"
    />

    <NButton
      type="primary"
      secondary
      :disabled="!canResend"
      :loading="loading"
      @click="emit('resend')"
    >
      {{ t('account.security.resendVerification') }}
    </NButton>
  </NCard>
</template>

