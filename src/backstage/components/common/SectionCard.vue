<script setup lang="ts">
import { NCard } from 'naive-ui'

defineProps<{
  title?: string
  noPadding?: boolean
}>()
</script>

<template>
  <NCard 
    :title="title"
    :bordered="false"
    class="shadow-sm hover:shadow-md transition-shadow rounded-xl bg-white dark:bg-gray-800"
    :content-style="noPadding ? { padding: 0 } : {}"
  >
    <template #header-extra v-if="$slots['header-extra']">
      <slot name="header-extra" />
    </template>
    <slot />
  </NCard>
</template>
