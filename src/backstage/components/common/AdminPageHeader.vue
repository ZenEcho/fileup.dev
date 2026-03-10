<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NButton } from 'naive-ui'

defineProps<{
  title: string
  desc?: string
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex justify-between items-center mb-6 px-1">
    <div>
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100 m-0">{{ title }}</h1>
      <p v-if="desc" class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-0">{{ desc }}</p>
    </div>
    
    <div class="header-actions">
      <slot name="actions">
        <NButton type="primary" secondary @click="emit('refresh')">
          <template #icon>
            <div class="i-ph-arrows-clockwise-bold" />
          </template>
          {{ t('admin.common.refresh') }}
        </NButton>
      </slot>
    </div>
  </div>
</template>
