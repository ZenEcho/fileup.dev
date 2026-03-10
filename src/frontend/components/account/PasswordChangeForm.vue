<script setup lang="ts">
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton, NCard, NForm, NFormItem, NInput, useMessage } from 'naive-ui';

interface PasswordPayload {
  currentPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
}

const props = defineProps<{
  hasPassword: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: 'submit', payload: PasswordPayload): void;
}>();

const { t } = useI18n();
const message = useMessage();

const form = reactive<PasswordPayload>({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
});

const onSubmit = () => {
  if (props.hasPassword && !form.currentPassword) {
    message.warning(t('account.security.currentPasswordRequired'));
    return;
  }

  if (!form.newPassword || !form.confirmNewPassword) {
    message.warning(t('account.security.newPasswordRequired'));
    return;
  }

  if (form.newPassword !== form.confirmNewPassword) {
    message.warning(t('account.security.passwordMismatch'));
    return;
  }

  emit('submit', {
    currentPassword: form.currentPassword || undefined,
    newPassword: form.newPassword,
    confirmNewPassword: form.confirmNewPassword,
  });
};

const reset = () => {
  form.currentPassword = '';
  form.newPassword = '';
  form.confirmNewPassword = '';
};

defineExpose({
  reset,
});
</script>

<template>
  <NCard size="small" :title="t('account.security.changePassword')">
    <NForm label-placement="top" class="grid grid-cols-1 gap-3">
      <NFormItem
        v-if="hasPassword"
        :label="t('account.security.currentPassword')"
      >
        <NInput
          v-model:value="form.currentPassword"
          type="password"
          show-password-on="click"
          :placeholder="t('account.security.currentPasswordPlaceholder')"
        />
      </NFormItem>

      <NFormItem :label="t('account.security.newPassword')">
        <NInput
          v-model:value="form.newPassword"
          type="password"
          show-password-on="click"
          :placeholder="t('account.security.newPasswordPlaceholder')"
        />
      </NFormItem>

      <NFormItem :label="t('account.security.confirmNewPassword')">
        <NInput
          v-model:value="form.confirmNewPassword"
          type="password"
          show-password-on="click"
          :placeholder="t('account.security.confirmNewPasswordPlaceholder')"
        />
      </NFormItem>

      <div class="flex justify-end">
        <NButton type="primary" :loading="loading" @click="onSubmit">
          {{ t('account.security.updatePassword') }}
        </NButton>
      </div>
    </NForm>
  </NCard>
</template>
