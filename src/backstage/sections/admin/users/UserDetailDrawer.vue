<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NPopconfirm,
  NSpace,
  NTag,
} from 'naive-ui';
import type { LoginSource, UserRow } from '@common/types';
import UserRoleTag from './UserRoleTag.vue';
import UserStatusTag from './UserStatusTag.vue';

const props = defineProps<{
  show: boolean;
  user: UserRow | null;
  formatDate: (value?: string | null) => string;
  roleLoading?: boolean;
  statusLoading?: boolean;
  resendLoading?: boolean;
  unbindGithubLoading?: boolean;
  unbindGoogleLoading?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:show', value: boolean): void;
  (event: 'edit'): void;
  (event: 'toggle-role'): void;
  (event: 'toggle-status'): void;
  (event: 'resend-verification'): void;
  (event: 'reset-password'): void;
  (event: 'force-unbind', provider: 'GITHUB' | 'GOOGLE'): void;
}>();

const { t } = useI18n();

const resolveAuthProviders = (user: UserRow | null): LoginSource[] => {
  if (!user) {
    return [];
  }

  if (Array.isArray(user.authProviders) && user.authProviders.length > 0) {
    return user.authProviders;
  }

  if (user.authProvider && user.authProvider !== 'MIXED') {
    return [user.authProvider as LoginSource];
  }

  return [];
};

const authProviderLabel = (provider: LoginSource) => {
  return t(`account.authProviderLabel.${provider}`);
};

const canResendVerification = computed(() => {
  if (!props.user?.email) {
    return false;
  }

  return Boolean(props.user.mailEnabled && props.user.verificationRequiredNow);
});

const hasGithubAuth = computed(() => resolveAuthProviders(props.user).includes('GITHUB'));
const hasGoogleAuth = computed(() => resolveAuthProviders(props.user).includes('GOOGLE'));
const canForceUnbind = computed(() => resolveAuthProviders(props.user).length > 1);
</script>

<template>
  <NDrawer :show="show" :width="520" @update:show="emit('update:show', $event)">
    <NDrawerContent :title="user ? `${user.username}` : t('admin.users.detail')" closable>
      <NDescriptions v-if="user" bordered :column="1" class="mb-4">
        <NDescriptionsItem :label="t('account.profile.username')">{{ user.username }}</NDescriptionsItem>
        <NDescriptionsItem :label="t('account.profile.displayName')">{{ user.displayName || '-' }}</NDescriptionsItem>
        <NDescriptionsItem :label="t('account.profile.email')">{{ user.email || '-' }}</NDescriptionsItem>
        <NDescriptionsItem :label="t('account.profile.authProvider')">
          <NSpace>
            <NTag v-for="provider in resolveAuthProviders(user)" :key="provider" size="small" round>
              {{ authProviderLabel(provider) }}
            </NTag>
            <span v-if="resolveAuthProviders(user).length <= 0">-</span>
          </NSpace>
        </NDescriptionsItem>
        <NDescriptionsItem :label="t('admin.common.status')"><UserStatusTag :status="user.status" /></NDescriptionsItem>
        <NDescriptionsItem :label="t('admin.users.role')"><UserRoleTag :role="user.role" /></NDescriptionsItem>
        <NDescriptionsItem :label="t('admin.users.pluginCount')">{{ user.pluginCount }}</NDescriptionsItem>
        <NDescriptionsItem :label="t('admin.users.reviewCount')">{{ user.reviewCount || 0 }}</NDescriptionsItem>
        <NDescriptionsItem :label="t('account.profile.joinedAt')">{{ formatDate(user.joinedAt) }}</NDescriptionsItem>
        <NDescriptionsItem :label="t('account.profile.lastLoginAt')">{{ formatDate(user.lastLoginAt) }}</NDescriptionsItem>
      </NDescriptions>

      <NSpace>
        <NButton @click="emit('edit')">{{ t('admin.users.edit') }}</NButton>

        <NPopconfirm @positive-click="emit('toggle-role')">
          <template #trigger>
            <NButton :loading="roleLoading" type="warning" secondary>
              {{ user?.role === 'ADMIN' ? t('admin.users.demote') : t('admin.users.promote') }}
            </NButton>
          </template>
          {{ t('admin.users.confirmRoleChange') }}
        </NPopconfirm>

        <NPopconfirm @positive-click="emit('toggle-status')">
          <template #trigger>
            <NButton :loading="statusLoading" :type="user?.status === 'BANNED' ? 'success' : 'error'" secondary>
              {{ user?.status === 'BANNED' ? t('admin.users.unban') : t('admin.users.ban') }}
            </NButton>
          </template>
          {{ t('admin.users.confirmStatusChange') }}
        </NPopconfirm>

        <NPopconfirm v-if="hasGithubAuth" @positive-click="emit('force-unbind', 'GITHUB')">
          <template #trigger>
            <NButton
              type="error"
              secondary
              :loading="unbindGithubLoading"
              :disabled="!canForceUnbind"
            >
              {{ t('admin.users.forceUnbindGithub') }}
            </NButton>
          </template>
          {{ t('admin.users.confirmForceUnbindGithub') }}
        </NPopconfirm>

        <NPopconfirm v-if="hasGoogleAuth" @positive-click="emit('force-unbind', 'GOOGLE')">
          <template #trigger>
            <NButton
              type="error"
              secondary
              :loading="unbindGoogleLoading"
              :disabled="!canForceUnbind"
            >
              {{ t('admin.users.forceUnbindGoogle') }}
            </NButton>
          </template>
          {{ t('admin.users.confirmForceUnbindGoogle') }}
        </NPopconfirm>

        <NButton
          :loading="resendLoading"
          :disabled="!canResendVerification"
          secondary
          @click="emit('resend-verification')"
        >
          {{ t('account.security.resendVerification') }}
        </NButton>

        <NButton secondary @click="emit('reset-password')">
          {{ t('admin.users.resetPassword') }}
        </NButton>
      </NSpace>
    </NDrawerContent>
  </NDrawer>
</template>
