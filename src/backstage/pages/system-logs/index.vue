<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SelectOption } from 'naive-ui'
import { useMessage } from 'naive-ui'

import { useAdminContext } from '@backstage/composables/useAdminContext'
import { useAdminVersionManagement } from '@backstage/composables'
import { useDateFormat, usePluginStatus } from '@common/composables'

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

const auditRows = computed(() => {
  const rows = allPlugins.value.flatMap((plugin) => {
    return plugin.versions
      .filter((version) => version.status !== 'PENDING')
      .map((version) => ({
        key: `${plugin.id}:${version.version}`,
        pluginId: plugin.id,
        pluginName: plugin.name,
        version: version.version,
        status: version.status,
        auditor: version.auditorId || '-',
        auditLog: version.auditLog || '-',
        createdAt: version.createdAt,
      }))
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
