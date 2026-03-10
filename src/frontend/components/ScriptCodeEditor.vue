<script setup lang="ts">
import { ScriptCodeEditor as CommonScriptCodeEditor } from '@common/ui'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
}>(), {
  placeholder: '',
  rows: 8
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const onUpdateModelValue = (value: string) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <CommonScriptCodeEditor v-bind="props" @update:model-value="onUpdateModelValue" />
</template>
