<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { NButton, NCard, NModal } from 'naive-ui';

const props = defineProps<{
  show: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:show', value: boolean): void;
  (event: 'confirm'): void;
}>();

const { t } = useI18n();
</script>

<template>
  <NModal :show="props.show" @update:show="emit('update:show', $event)">
    <NCard style="width: min(420px, 90vw)" :title="t('account.security.resendVerification')" closable @close="emit('update:show', false)">
      <p class="text-sm text-text-secondary">{{ t('admin.users.resendVerificationTip') }}</p>
      <div class="flex justify-end gap-2">
        <NButton @click="emit('update:show', false)">{{ t('admin.common.cancel') }}</NButton>
        <NButton type="primary" :loading="loading" @click="emit('confirm')">{{ t('admin.common.confirm') }}</NButton>
      </div>
    </NCard>
  </NModal>
</template>
