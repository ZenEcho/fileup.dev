<script setup lang="ts">
import { computed } from 'vue'
import { NTag, type TagProps } from 'naive-ui'
import { usePluginStatus } from '@common/composables'
import type { PluginStatus } from '@common/types'

const props = withDefaults(defineProps<{
  status?: PluginStatus | string
  label?: string
  round?: boolean
  size?: TagProps['size']
}>(), {
  label: '',
  round: true,
  size: 'small'
})

const { getPluginStatusType, getPluginStatusLabel } = usePluginStatus()

const tagType = computed(() => getPluginStatusType(props.status))
const tagLabel = computed(() => props.label || getPluginStatusLabel(props.status))
</script>

<template>
  <NTag :type="tagType" :round="round" :size="size">
    <slot>{{ tagLabel }}</slot>
  </NTag>
</template>
