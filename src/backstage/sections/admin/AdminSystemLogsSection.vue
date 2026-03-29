<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NCard, NEmpty, NSelect, NTabPane, NTabs, NTag } from 'naive-ui'
import type { AuditHistoryRow, VersionAction } from '@common/types'

import type { SelectOption } from 'naive-ui'

interface AdminLog {
  id: string
  createdAt: string
  category: 'audit' | 'plugin' | 'version' | 'review' | 'user'
  action: string
  target: string
  result: 'SUCCESS' | 'FAILED'
  detail: string
}

const props = defineProps<{
  auditRows: AuditHistoryRow[]
  getStatusType: (status?: string) => any
  getStatusLabel: (status?: string) => string
  formatDate: (value?: string | null) => string
  adminLogs: AdminLog[]
  selectedVersionPluginId: string
  pluginOptions: SelectOption[]
  versionLoading: boolean
  versionActionLogs: VersionAction[]
  onRefreshVersionLogs: (pluginId: string) => void
}>()

const emit = defineEmits<{
  (event: 'update:selectedVersionPluginId', value: string): void
}>()

const selectedVersionPluginIdModel = computed({
  get: () => props.selectedVersionPluginId,
  set: (value: string) => emit('update:selectedVersionPluginId', value),
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
  <section class="p-1">
    <NTabs type="line" animated>
      <NTabPane name="audit" tab="审核日志">
        <div class="flex flex-col gap-3 mt-3">
          <NCard v-for="row in auditRows" :key="`audit-${row.key}`" size="small" class="shadow-sm rounded-lg hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between gap-3 mb-2">
              <strong class="font-medium text-gray-800 dark:text-gray-200">{{ row.pluginName }} v{{ row.version }}</strong>
              <NTag :type="getStatusType(row.status)" round size="small">{{ getStatusLabel(row.status) }}</NTag>
            </div>
            <p class="text-gray-500 dark:text-gray-400 text-sm m-0 mt-1">审核员：{{ row.auditor }}</p>
            <p class="text-gray-500 dark:text-gray-400 text-sm m-0 mt-0.5">审核日志：{{ row.auditLog }}</p>
            <small class="block text-gray-400 mt-2">{{ formatDate(row.createdAt) }}</small>
          </NCard>
        </div>
      </NTabPane>

      <NTabPane name="admin" tab="管理员操作日志">
        <NEmpty v-if="!adminLogs.length" description="暂无操作日志" class="my-10" />
        <div v-else class="flex flex-col gap-3 mt-3">
          <NCard v-for="log in adminLogs" :key="log.id" size="small" class="shadow-sm bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
            <div class="flex items-center justify-between gap-3 mb-2">
              <strong class="font-medium text-gray-800 dark:text-gray-200">{{ log.action }}</strong>
              <NTag :type="log.result === 'SUCCESS' ? 'success' : 'error'" round size="small">{{ log.result }}</NTag>
            </div>
            <p class="text-gray-500 dark:text-gray-400 text-sm m-0">分类：{{ log.category }} · 目标：{{ log.target }}</p>
            <small class="block text-gray-400 mt-2">{{ formatDate(log.createdAt) }} · {{ log.detail }}</small>
          </NCard>
        </div>
      </NTabPane>

      <NTabPane name="version" tab="插件版本操作日志">
        <div class="flex flex-col md:flex-row gap-4 mb-4 mt-1">
          <NSelect class="flex-1 max-w-sm" v-model:value="selectedVersionPluginIdModel" :options="pluginOptions" placeholder="选择插件" />
          <NButton :loading="versionLoading" @click="selectedVersionPluginIdModel && onRefreshVersionLogs(selectedVersionPluginIdModel)">刷新日志</NButton>
        </div>
        <NEmpty v-if="!versionActionLogs.length" description="暂无版本操作日志" class="my-10" />
        <div v-else class="flex flex-col gap-3 mt-3">
          <NCard v-for="log in versionActionLogs" :key="`sys-${log.id}`" size="small" class="shadow-sm rounded-lg">
            <div class="flex items-center justify-between gap-3 mb-2">
              <strong class="font-medium text-gray-800 dark:text-gray-200">{{ getVersionActionLabel(log.action) }}</strong>
              <small class="text-gray-400">{{ formatDate(log.createdAt) }}</small>
            </div>
            <p class="text-gray-500 dark:text-gray-400 text-sm m-0 mt-1">操作人：{{ log.operator.username }}</p>
            <p class="text-gray-500 dark:text-gray-400 text-sm m-0 mt-0.5">{{ getVersionActionTarget(log) }}</p>
            <small class="block bg-gray-50 dark:bg-gray-800 p-2 mt-2 rounded text-gray-600 dark:text-gray-300">{{ log.reason || '无说明' }}</small>
          </NCard>
        </div>
      </NTabPane>
    </NTabs>
  </section>
</template>
