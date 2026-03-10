<script setup lang="ts">
import { PluginContentPreview as CommonPluginContentPreview } from '@common/ui'

const props = withDefaults(defineProps<{
  content: unknown
  showRawJson?: boolean
}>(), {
  showRawJson: false
})
</script>

<template>
  <CommonPluginContentPreview v-bind="props" />
</template>
