<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton, NForm, NFormItem, NInput } from 'naive-ui';
import type { UserRow } from '@common/types';

interface EditPayload {
  username?: string;
  displayName?: string | null;
  email?: string | null;
  avatar?: string | null;
  bio?: string | null;
  adminNote?: string | null;
}

const props = defineProps<{
  user: UserRow | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: 'save', payload: EditPayload): void;
  (event: 'cancel'): void;
}>();

const { t } = useI18n();

const form = reactive<Required<EditPayload>>({
  username: '',
  displayName: '',
  email: '',
  avatar: '',
  bio: '',
  adminNote: '',
});

watch(
  () => props.user,
  (user) => {
    form.username = user?.username || '';
    form.displayName = user?.displayName || '';
    form.email = user?.email || '';
    form.avatar = user?.avatar || '';
    form.bio = user?.bio || '';
    form.adminNote = user?.adminNote || '';
  },
  { immediate: true },
);

const save = () => {
  emit('save', {
    username: form.username,
    displayName: form.displayName || null,
    email: form.email || null,
    avatar: form.avatar || null,
    bio: form.bio || null,
    adminNote: form.adminNote || null,
  });
};
</script>

<template>
  <NForm label-placement="top" class="grid grid-cols-1 gap-3">
    <NFormItem :label="t('account.profile.username')">
      <NInput v-model:value="form.username" />
    </NFormItem>

    <NFormItem :label="t('account.profile.displayName')">
      <NInput v-model:value="form.displayName" />
    </NFormItem>

    <NFormItem :label="t('account.profile.email')">
      <NInput v-model:value="form.email" />
    </NFormItem>

    <NFormItem :label="t('account.profile.avatar')">
      <NInput v-model:value="form.avatar" />
    </NFormItem>

    <NFormItem :label="t('account.profile.bio')">
      <NInput v-model:value="form.bio" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
    </NFormItem>

    <NFormItem :label="t('admin.users.adminNote')">
      <NInput v-model:value="form.adminNote" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
    </NFormItem>

    <div class="flex justify-end gap-2">
      <NButton @click="emit('cancel')">{{ t('admin.common.cancel') }}</NButton>
      <NButton type="primary" :loading="loading" @click="save">{{ t('common.save') }}</NButton>
    </div>
  </NForm>
</template>
