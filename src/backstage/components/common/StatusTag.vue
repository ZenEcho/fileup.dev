<script setup lang="ts">
import { computed } from 'vue'
import { NTag } from 'naive-ui'
import type { PluginStatus } from '@common/types'

const props = defineProps<{
  status: PluginStatus | string
  label?: string
  round?: boolean
  size?: 'small' | 'medium' | 'large'
}>()

// Generic mapping for our existing status enums
const typeMap: Record<string, 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
  // Can expand to other status strings later
}

const tagType = computed(() => {
  return typeMap[props.status] || 'default'
})

</script>

<template>
  <NTag :type="tagType" :round="round" :size="size || 'small'">
    {{ label || status }}
  </NTag>
</template>
