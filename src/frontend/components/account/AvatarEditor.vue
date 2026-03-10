<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NAvatar, NButton, NInput } from 'naive-ui';

const props = defineProps<{
  value: string | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:value', value: string | null): void;
}>();

const { t } = useI18n();

const avatarModel = computed({
  get: () => props.value || '',
  set: (value: string) => {
    const normalized = value.trim();
    emit('update:value', normalized ? normalized : null);
  },
});

const clearAvatar = () => {
  emit('update:value', null);
};
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <NAvatar
        :size="56"
        round
        :src="value || undefined"
      />
      <div class="text-sm text-text-secondary">
        {{ t('account.profile.avatarHint') }}
      </div>
    </div>

    <div class="flex gap-2">
      <NInput
        v-model:value="avatarModel"
        :disabled="disabled"
        :placeholder="t('account.profile.avatarPlaceholder')"
      />
      <NButton
        :disabled="disabled"
        secondary
        @click="clearAvatar"
      >
        {{ t('common.clear') }}
      </NButton>
    </div>
  </div>
</template>
