<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NTag } from 'naive-ui';
import type { UserRole } from '@common/types';

const props = defineProps<{
  role: UserRole;
}>();

const { t } = useI18n();

const tagType = computed(() => {
  return props.role === 'ADMIN' ? 'warning' : 'default';
});
</script>

<template>
  <NTag :type="tagType" round size="small">
    {{ props.role === 'ADMIN' ? t('admin.users.roleAdmin') : t('admin.users.roleDeveloper') }}
  </NTag>
</template>
