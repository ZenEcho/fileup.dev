<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NCard, NEmpty, NInput, NSelect, NTag } from 'naive-ui'
import type { PluginStatus, PluginVersion, VersionAction } from '@common/types'

import type { SelectOption } from 'naive-ui'

const props = defineProps<{
  selectedVersionPluginId: string
  pluginOptions: SelectOption[]
  versionReason: string
  activeVersion: string
  versionLoading: boolean
  versionRows: PluginVersion[]
  versionActionLogs: VersionAction[]
  formatDate: (value?: string | null) => string
  getStatusType: (status?: PluginStatus) => any
  getStatusLabel: (status?: PluginStatus) => string
  canRollback: (row: PluginVersion) => boolean
  canDeleteVersion: (row: PluginVersion) => boolean
  onRollbackVersion: (row: PluginVersion) => void
  onDeleteVersion: (row: PluginVersion) => void
  onOpenDiff: (row: PluginVersion) => void
}>()

const emit = defineEmits<{
  (event: 'update:selectedVersionPluginId', value: string): void
  (event: 'update:versionReason', value: string): void
}>()

const selectedVersionPluginIdModel = computed({
  get: () => props.selectedVersionPluginId,
  set: (value: string) => emit('update:selectedVersionPluginId', value),
})

const versionReasonModel = computed({
  get: () => props.versionReason,
  set: (value: string) => emit('update:versionReason', value),
})

const actionLabelMap: Record<string, string> = {
  SUBMIT: '提交版本',
  RESUBMIT: '重新提交',
  AUDIT_APPROVED: '审核通过',
  AUDIT_REJECTED: '审核拒绝',
  AUDIT_CHANGES_REQUIRED: '打回修改',
  VISIBILITY_PUBLIC: '可见性设为公开',
  VISIBILITY_PRIVATE: '可见性设为私有',
  FORCE_UNPUBLISH: '强制下架',
  FORCE_REPUBLISH: '强制上架',
  PLUGIN_DELETE: '删除插件',
  ROLLBACK: '回滚版本',
  DELETE: '删除版本',
}

const getVersionActionLabel = (action: string) => {
  return actionLabelMap[action] || action
}

const getVersionActionTarget = (log: VersionAction) => {
  if (log.action === 'ROLLBACK') {
    return `${log.fromVersion || '-'} -> ${log.toVersion || '-'}`
  }
  if (log.targetVersion) {
    return `目标版本：${log.targetVersion}`
  }
  return '-'
}
</script>

<template>
  <section class="p-1 max-w-5xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row gap-4 mb-2">
      <NSelect class="w-full sm:w-64" v-model:value="selectedVersionPluginIdModel" :options="pluginOptions" placeholder="选择插件" />
      <NInput class="flex-1" v-model:value="versionReasonModel" placeholder="版本操作说明" clearable />
    </div>

    <NCard class="shadow-sm rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 mb-6">
      <div class="flex items-center text-gray-700 dark:text-gray-200">
        <strong class="mr-2">当前生效版本：</strong>
        <span class="font-mono text-lg bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded">{{ activeVersion }}</span>
      </div>
    </NCard>

    <div v-if="versionLoading" class="text-center p-10 text-gray-500">加载版本数据中...</div>
    <NEmpty v-else-if="!versionRows.length" description="暂无版本数据" class="my-10" />
    <div v-else class="flex flex-col gap-4">
      <NCard v-for="row in versionRows" :key="row.id" class="shadow-sm rounded-xl border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between gap-3 mb-3 border-b border-gray-50 dark:border-gray-800/50 pb-3">
          <div class="flex items-center flex-wrap gap-2">
            <strong class="text-lg font-mono">v{{ row.version }}</strong>
            <NTag class="ml-2" :type="getStatusType(row.status)" round size="small">{{ getStatusLabel(row.status) }}</NTag>
            <NTag v-if="row.isActive" type="success" round size="small">当前生效</NTag>
            <NTag v-if="row.deletedAt" type="error" round size="small">已删除</NTag>
          </div>
          <small class="text-gray-400 shrink-0">{{ formatDate(row.createdAt) }}</small>
        </div>
        <p class="text-gray-600 dark:text-gray-300 text-sm m-0 mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">{{ row.changelog || '无更新日志' }}</p>
        <div class="flex flex-wrap gap-3 mt-2">
          <NButton size="small" type="warning" secondary :disabled="!canRollback(row)" @click="onRollbackVersion(row)">回滚版本</NButton>
          <NButton size="small" type="error" secondary :disabled="!canDeleteVersion(row)" @click="onDeleteVersion(row)">删除版本</NButton>
          <NButton size="small" :disabled="Boolean(row.deletedAt)" @click="onOpenDiff(row)">查看 diff</NButton>
        </div>
      </NCard>
    </div>

    <NCard class="mt-8 shadow-sm rounded-xl border-gray-100 dark:border-gray-800" title="版本日志">
      <NEmpty v-if="!versionActionLogs.length" description="暂无版本操作记录" class="my-6" />
      <div v-else class="flex flex-col gap-3 mt-3">
        <NCard v-for="log in versionActionLogs" :key="log.id" size="small" class="bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
          <div class="flex items-center justify-between gap-3 mb-2">
            <strong class="font-medium text-gray-800 dark:text-gray-200">{{ getVersionActionLabel(log.action) }}</strong>
            <small class="text-gray-400">{{ formatDate(log.createdAt) }}</small>
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-sm m-0 mt-1">操作人：{{ log.operator.username }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-sm m-0 mt-0.5">{{ getVersionActionTarget(log) }}</p>
          <small class="block bg-gray-100 dark:bg-gray-800 p-2 mt-2 rounded text-gray-600 dark:text-gray-300">{{ log.reason || '无说明' }}</small>
        </NCard>
      </div>
    </NCard>
  </section>
</template>

