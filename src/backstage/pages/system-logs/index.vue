<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SelectOption } from 'naive-ui'
import { useMessage } from 'naive-ui'

import { useAdminContext } from '@backstage/composables/useAdminContext'
import { useAdminVersionManagement } from '@backstage/composables'
import { useDateFormat, usePluginStatus } from '@common/composables'
import type { PluginStatus, PluginVersionActionType } from '@common/types'

import AdminPageHeader from '@backstage/components/common/AdminPageHeader.vue'
import AdminSystemLogsSection from '@backstage/sections/admin/AdminSystemLogsSection.vue'

const { t } = useI18n()
const message = useMessage()
const { allPlugins, adminLogs, addLog, refreshAll } = useAdminContext()
const { formatDateTime: formatDate } = useDateFormat({ locale: 'zh-CN' })
const { getPluginStatusLabel: getStatusLabel, getPluginStatusType: getStatusType } = usePluginStatus()

const pluginOptions = computed<SelectOption[]>(() => {
  return allPlugins.value.map((plugin) => ({ label: plugin.name, value: plugin.id }))
})

const auditActionStatusMap: Partial<Record<PluginVersionActionType, PluginStatus>> = {
  AUDIT_APPROVED: 'APPROVED',
  AUDIT_REJECTED: 'REJECTED',
  AUDIT_CHANGES_REQUIRED: 'CHANGES_REQUIRED',
}

const auditRows = computed(() => {
  const rows = allPlugins.value.flatMap((plugin) => {
    return (plugin.versionActionLogs || []).flatMap((action) => {
      const status = auditActionStatusMap[action.action]
      if (!status) {
        return []
      }

      return [{
        key: action.id,
        pluginId: plugin.id,
        pluginName: plugin.name,
        version: action.targetVersion || '-',
        status,
        auditor: action.operator?.username || '-',
        auditLog: action.reason || '-',
        createdAt: action.createdAt,
      }]
    })
  })
  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const {
  selectedVersionPluginId,
  versionLoading,
  versionActionLogs,
  fetchVersionData,
} = useAdminVersionManagement({
  allPlugins,
  message,
  addLog,
  refreshAll,
})

watch(selectedVersionPluginId, async (pluginId) => {
  if (pluginId) await fetchVersionData(pluginId)
})

</script>

<template>
  <div>
    <AdminPageHeader 
      :title="t('admin.menu.logs')" 
      @refresh="refreshAll(true)"
    />

    <AdminSystemLogsSection
      :audit-rows="auditRows"
      :get-status-type="getStatusType"
      :get-status-label="getStatusLabel"
      :format-date="formatDate"
      :admin-logs="adminLogs"
      :selected-version-plugin-id="selectedVersionPluginId"
      :plugin-options="pluginOptions as any"
      :version-loading="versionLoading"
      :version-action-logs="versionActionLogs"
      :on-refresh-version-logs="fetchVersionData"
      @update:selected-version-plugin-id="selectedVersionPluginId = $event"
    />
  </div>
</template>
