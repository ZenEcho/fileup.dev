<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { NButton, NCard, NForm, NFormItem, NInput, NTag, NSpace, useMessage } from 'naive-ui';
import { fetchMyProfile, updateMyProfile, type MyProfile } from '@common/api';
import { useDateFormat } from '@common/composables';
import { useAuthStore } from '@common/stores/auth';
import AvatarEditor from '@frontend/components/account/AvatarEditor.vue';

const { t } = useI18n();
const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();
const { formatDateTime } = useDateFormat();

const loading = ref(false);
const saving = ref(false);
const profile = ref<MyProfile | null>(null);

const form = reactive({
  username: '',
  displayName: null as string | null,
  avatar: null as string | null,
  bio: null as string | null,
});

const initialSnapshot = ref('');

type LoginSource = 'LOCAL' | 'GITHUB' | 'GOOGLE';

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

const statusTagType = computed(() => {
  if (profile.value?.status === 'ACTIVE') return 'success';
  if (profile.value?.status === 'PENDING') return 'warning';
  return 'error';
});

const dirty = computed(() => {
  const snapshot = JSON.stringify({
    username: form.username,
    displayName: form.displayName,
    avatar: form.avatar,
    bio: form.bio,
  });
  return snapshot !== initialSnapshot.value;
});

const buildSnapshot = () => {
  return JSON.stringify({
    username: form.username,
    displayName: form.displayName,
    avatar: form.avatar,
    bio: form.bio,
  });
};

const applyProfile = (value: MyProfile) => {
  profile.value = value;
  form.username = value.username;
  form.displayName = value.displayName;
  form.avatar = value.avatar;
  form.bio = value.bio;
  initialSnapshot.value = buildSnapshot();
};

const loadProfile = async () => {
  loading.value = true;
  try {
    const response = await fetchMyProfile();
    applyProfile(response.data);
  } catch (error) {
    console.error('load profile failed', error);
    message.error(t('account.profile.loadFailed'));
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  if (!dirty.value || saving.value) {
    return;
  }

  saving.value = true;
  try {
    const response = await updateMyProfile({
      username: form.username,
      displayName: form.displayName,
      avatar: form.avatar,
      bio: form.bio,
    });
    applyProfile(response.data);
    await authStore.fetchUser();
    message.success(t('account.profile.saveSuccess'));
  } catch (error) {
    console.error('save profile failed', error);
    message.error(t('account.profile.saveFailed'));
  } finally {
    saving.value = false;
  }
};

const reset = () => {
  if (!profile.value) {
    return;
  }

  applyProfile(profile.value);
};

onMounted(async () => {
  if (!authStore.token) {
    await router.push('/login?next=/dashboard/profile');
    return;
  }

  await loadProfile();
});
</script>

<template>
  <div class="pt-25 pb-16 container-custom min-h-screen flex flex-col gap-6">
    <NCard>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold m-0">{{ t('account.profile.title') }}</h1>
          <p class="text-text-secondary mt-1 mb-0">{{ t('account.profile.subtitle') }}</p>
        </div>
        <NTag :type="statusTagType" round>
          {{ t(`account.status.${profile?.status || 'ACTIVE'}`) }}
        </NTag>
      </div>
    </NCard>

    <NCard :loading="loading">
      <NForm label-placement="top" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NFormItem :label="t('account.profile.username')">
          <NInput v-model:value="form.username" />
        </NFormItem>

        <NFormItem :label="t('account.profile.displayName')">
          <NInput v-model:value="form.displayName" :placeholder="t('account.profile.displayNamePlaceholder')" />
        </NFormItem>

        <div class="lg:col-span-2">
          <NFormItem :label="t('account.profile.avatar')">
            <AvatarEditor v-model:value="form.avatar" :disabled="saving" />
          </NFormItem>
        </div>

        <div class="lg:col-span-2">
          <NFormItem :label="t('account.profile.bio')">
            <NInput
              v-model:value="form.bio"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 5 }"
              :placeholder="t('account.profile.bioPlaceholder')"
            />
          </NFormItem>
        </div>

        <NFormItem :label="t('account.profile.email')">
          <NInput :value="profile?.email || '-'" disabled />
        </NFormItem>

        <NFormItem :label="t('account.profile.authProvider')">
          <NSpace>
            <NTag v-for="provider in authProviders" :key="provider" size="small" round>
              {{ providerLabel(provider) }}
            </NTag>
            <span v-if="authProviders.length <= 0">-</span>
          </NSpace>
        </NFormItem>

        <NFormItem :label="t('account.profile.joinedAt')">
          <NInput :value="formatDateTime(profile?.createdAt || null)" disabled />
        </NFormItem>

        <NFormItem :label="t('account.profile.lastLoginAt')">
          <NInput :value="formatDateTime(profile?.lastLoginAt || null)" disabled />
        </NFormItem>
      </NForm>

      <div class="flex justify-end gap-2 mt-4">
        <NButton :disabled="!dirty || saving" @click="reset">
          {{ t('common.reset') }}
        </NButton>
        <NButton type="primary" :loading="saving" :disabled="!dirty" @click="save">
          {{ t('common.save') }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>
