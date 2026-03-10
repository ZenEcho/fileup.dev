<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NTag } from 'naive-ui';
import type { UserStatus } from '@common/types';

const props = defineProps<{
  status: UserStatus;
}>();

const { t } = useI18n();

const tagType = computed(() => {
  if (props.status === 'ACTIVE') return 'success';
  if (props.status === 'PENDING') return 'warning';
  return 'error';
});
</script>

<template>
  <NTag :type="tagType" round size="small">
    {{ t(`account.status.${props.status}`) }}
  </NTag>
</template>
