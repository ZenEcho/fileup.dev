<script setup lang="ts">
import { NModal, NCard, NCode } from 'naive-ui'

const props = defineProps<{
  show: boolean
  title: string
  code: string
}>()

const emit = defineEmits<{
  (event: 'update:show', value: boolean): void
}>()
</script>

<template>
  <NModal :show="show" @update:show="emit('update:show', $event)">
    <NCard style="width: min(980px, calc(100vw - 24px));" :title="title" closable @close="emit('update:show', false)">
      <NCode :code="code" language="diff" word-wrap />
    </NCard>
  </NModal>
</template>
