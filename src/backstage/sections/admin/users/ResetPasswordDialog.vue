<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { NButton, NCard, NModal, NRadioButton, NRadioGroup, NSpace } from 'naive-ui';

const props = defineProps<{
  show: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:show', value: boolean): void;
  (event: 'confirm', mode: 'LINK' | 'TEMP_PASSWORD'): void;
}>();

const { t } = useI18n();
const mode = ref<'LINK' | 'TEMP_PASSWORD'>('LINK');

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      mode.value = 'LINK';
    }
  },
);
</script>

<template>
  <NModal :show="props.show" @update:show="emit('update:show', $event)">
    <NCard style="width: min(460px, 90vw)" :title="t('admin.users.resetPassword')" closable @close="emit('update:show', false)">
      <p class="text-sm text-text-secondary mb-3">{{ t('admin.users.resetPasswordTip') }}</p>

      <NRadioGroup v-model:value="mode" class="mb-4">
        <NSpace vertical>
          <NRadioButton value="LINK">{{ t('admin.users.resetPasswordModeLink') }}</NRadioButton>
          <NRadioButton value="TEMP_PASSWORD">{{ t('admin.users.resetPasswordModeTemp') }}</NRadioButton>
        </NSpace>
      </NRadioGroup>

      <div class="flex justify-end gap-2">
        <NButton @click="emit('update:show', false)">{{ t('admin.common.cancel') }}</NButton>
        <NButton type="primary" :loading="loading" @click="emit('confirm', mode)">{{ t('admin.common.confirm') }}</NButton>
      </div>
    </NCard>
  </NModal>
</template>
