<script setup lang="ts">
import { NModal, NCard, NCode, NAlert } from 'naive-ui'

const props = defineProps<{
  show: boolean
  data: {
    title: string
    score: number
    level: string
    rules: string[]
    script: string
  } | null
}>()

const emit = defineEmits<{
  (event: 'update:show', value: boolean): void
}>()
</script>

<template>
  <NModal :show="show" @update:show="emit('update:show', $event)">
    <NCard style="width: min(920px, calc(100vw - 24px));" title="风险详情" closable @close="emit('update:show', false)">
      <template v-if="data">
        <div class="meta-grid mb-3">
          <div><strong>插件版本：</strong>{{ data.title }}</div>
          <div><strong>风险分：</strong>{{ data.score }}</div>
          <div><strong>风险等级：</strong>{{ data.level }}</div>
          <div><strong>命中规则：</strong>{{ data.rules.length || 0 }}</div>
        </div>
        <NAlert type="warning" class="mb-3">
          {{ data.rules.length ? data.rules.join(' / ') : '未命中明显风险规则' }}
        </NAlert>
        <NCode :code="data.script || '// 未找到脚本内容'" language="javascript" word-wrap />
      </template>
    </NCard>
  </NModal>
</template>

<style scoped>
.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  color: #334155;
  margin-bottom: 10px;
}
.mb-3 {
  margin-bottom: 12px;
}
@media (max-width: 920px) {
  .meta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
