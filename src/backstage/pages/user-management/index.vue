<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { NCard, NDrawer, NDrawerContent, useMessage } from 'naive-ui';
import {
  fetchAdminUserDetail,
  fetchAdminUsers,
  forceUnbindAdminUserOAuthProvider,
  resendAdminUserVerification,
  resetAdminUserPassword,
  updateAdminUser,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminUpdateUserPayload,
} from '@common/api';
import { useDateFormat } from '@common/composables';
import type { UserRow } from '@common/types';
import AdminPageHeader from '@backstage/components/common/AdminPageHeader.vue';
import ResendVerificationDialog from '@backstage/sections/admin/users/ResendVerificationDialog.vue';
import ResetPasswordDialog from '@backstage/sections/admin/users/ResetPasswordDialog.vue';
import UserDetailDrawer from '@backstage/sections/admin/users/UserDetailDrawer.vue';
import UserEditForm from '@backstage/sections/admin/users/UserEditForm.vue';
import UserManagementTable from '@backstage/sections/admin/users/UserManagementTable.vue';

const { t } = useI18n();
const message = useMessage();
const { formatDateTime: formatDate } = useDateFormat({ locale: 'zh-CN' });

const loading = ref(false);
const users = ref<UserRow[]>([]);
const keyword = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

const detailVisible = ref(false);
const editVisible = ref(false);
const selectedUser = ref<UserRow | null>(null);

const roleLoading = ref(false);
const statusLoading = ref(false);
const editLoading = ref(false);
const resendLoading = ref(false);
const resendDialogVisible = ref(false);
const resetPasswordDialogVisible = ref(false);
const resetPasswordLoading = ref(false);
const unbindGithubLoading = ref(false);
const unbindGoogleLoading = ref(false);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

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

const resolveForceUnbindErrorMessage = (error: unknown) => {
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
    return `${t('admin.users.forceUnbindFailed')} (${code})`;
  }

  return t('admin.users.forceUnbindFailed');
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await fetchAdminUsers({
      keyword: keyword.value || undefined,
      page: page.value,
      pageSize: pageSize.value,
    });

    users.value = response.data.items;
    total.value = response.data.total;
  } catch (error) {
    console.error('fetch admin users failed', error);
    message.error(t('admin.users.loadFailed'));
  } finally {
    loading.value = false;
  }
};

const refreshSelectedUser = async () => {
  if (!selectedUser.value?.id) {
    return;
  }

  const response = await fetchAdminUserDetail(selectedUser.value.id);
  selectedUser.value = response.data;
};

const onView = async (user: UserRow) => {
  try {
    const response = await fetchAdminUserDetail(user.id);
    selectedUser.value = response.data;
    detailVisible.value = true;
  } catch (error) {
    console.error('fetch admin user detail failed', error);
    message.error(t('admin.users.detailLoadFailed'));
  }
};

const onEditSave = async (payload: AdminUpdateUserPayload) => {
  if (!selectedUser.value) {
    return;
  }

  editLoading.value = true;
  try {
    const response = await updateAdminUser(selectedUser.value.id, payload);
    selectedUser.value = response.data;
    editVisible.value = false;
    message.success(t('admin.users.saveSuccess'));
    await fetchUsers();
  } catch (error) {
    console.error('update admin user failed', error);
    message.error(t('admin.users.saveFailed'));
  } finally {
    editLoading.value = false;
  }
};

const toggleRole = async () => {
  if (!selectedUser.value) {
    return;
  }

  const nextRole = selectedUser.value.role === 'ADMIN' ? 'DEVELOPER' : 'ADMIN';

  roleLoading.value = true;
  try {
    const response = await updateAdminUserRole(selectedUser.value.id, nextRole);
    selectedUser.value = response.data;
    message.success(t('admin.users.roleUpdated'));
    await fetchUsers();
  } catch (error) {
    console.error('update role failed', error);
    message.error(t('admin.users.roleUpdateFailed'));
  } finally {
    roleLoading.value = false;
  }
};

const toggleStatus = async () => {
  if (!selectedUser.value) {
    return;
  }

  const nextStatus = selectedUser.value.status === 'BANNED' ? 'ACTIVE' : 'BANNED';

  statusLoading.value = true;
  try {
    const response = await updateAdminUserStatus(selectedUser.value.id, nextStatus);
    selectedUser.value = response.data;
    message.success(t('admin.users.statusUpdated'));
    await fetchUsers();
  } catch (error) {
    console.error('update status failed', error);
    message.error(t('admin.users.statusUpdateFailed'));
  } finally {
    statusLoading.value = false;
  }
};

const forceUnbindOAuthProvider = async (provider: 'GITHUB' | 'GOOGLE') => {
  if (!selectedUser.value) {
    return;
  }

  const loadingRef = provider === 'GITHUB' ? unbindGithubLoading : unbindGoogleLoading;
  if (loadingRef.value) {
    return;
  }

  loadingRef.value = true;
  try {
    const response = await forceUnbindAdminUserOAuthProvider(selectedUser.value.id, provider.toLowerCase() as 'github' | 'google');
    selectedUser.value = response.data;
    message.success(
      provider === 'GITHUB'
        ? t('admin.users.forceUnbindGithubSuccess')
        : t('admin.users.forceUnbindGoogleSuccess'),
    );
    await fetchUsers();
  } catch (error) {
    console.error('force unbind oauth failed', error);
    message.error(resolveForceUnbindErrorMessage(error));
  } finally {
    loadingRef.value = false;
  }
};

const resendVerification = async () => {
  if (!selectedUser.value) {
    return;
  }

  resendLoading.value = true;
  try {
    const response = await resendAdminUserVerification(selectedUser.value.id);

    if (response.data.resent) {
      message.success(t('account.security.resendSuccess'));
      resendDialogVisible.value = false;
      await refreshSelectedUser();
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

const resetPassword = async (mode: 'LINK' | 'TEMP_PASSWORD') => {
  if (!selectedUser.value) {
    return;
  }

  resetPasswordLoading.value = true;
  try {
    await resetAdminUserPassword(selectedUser.value.id, { mode });
    message.success(
      mode === 'LINK'
        ? t('admin.users.resetPasswordLinkSent')
        : t('admin.users.resetPasswordTempSent'),
    );
    resetPasswordDialogVisible.value = false;
    await refreshSelectedUser();
  } catch (error) {
    console.error('reset password failed', error);
    message.error(t('admin.users.resetPasswordFailed'));
  } finally {
    resetPasswordLoading.value = false;
  }
};

watch(keyword, () => {
  page.value = 1;
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(() => {
    void fetchUsers();
  }, 260);
});

watch(page, () => {
  void fetchUsers();
});

onMounted(() => {
  void fetchUsers();
});
</script>

<template>
  <div class="space-y-4">
    <AdminPageHeader :title="t('admin.menu.users')" @refresh="fetchUsers" />

    <NCard>
      <UserManagementTable
        :users="users"
        :loading="loading"
        :keyword="keyword"
        :page="page"
        :page-size="pageSize"
        :total="total"
        :format-date="formatDate"
        @update:keyword="keyword = $event"
        @update:page="page = $event"
        @view="onView"
      />
    </NCard>

    <UserDetailDrawer
      v-model:show="detailVisible"
      :user="selectedUser"
      :format-date="formatDate"
      :role-loading="roleLoading"
      :status-loading="statusLoading"
      :resend-loading="resendLoading"
      :unbind-github-loading="unbindGithubLoading"
      :unbind-google-loading="unbindGoogleLoading"
      @edit="editVisible = true"
      @toggle-role="toggleRole"
      @toggle-status="toggleStatus"
      @force-unbind="forceUnbindOAuthProvider"
      @resend-verification="resendDialogVisible = true"
      @reset-password="resetPasswordDialogVisible = true"
    />

    <NDrawer :show="editVisible" :width="560" @update:show="editVisible = $event">
      <NDrawerContent :title="t('admin.users.edit')" closable>
        <UserEditForm
          :user="selectedUser"
          :loading="editLoading"
          @save="onEditSave"
          @cancel="editVisible = false"
        />
      </NDrawerContent>
    </NDrawer>

    <ResendVerificationDialog
      v-model:show="resendDialogVisible"
      :loading="resendLoading"
      @confirm="resendVerification"
    />

    <ResetPasswordDialog
      v-model:show="resetPasswordDialogVisible"
      :loading="resetPasswordLoading"
      @confirm="resetPassword"
    />
  </div>
</template>
