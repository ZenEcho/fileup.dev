<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NModal, NCode, NCard } from 'naive-ui'
import type { SelectOption } from 'naive-ui'

import { useAdminContext } from '@backstage/composables/useAdminContext'
import { useAdminVersionManagement } from '@backstage/composables'
import { useDateFormat, usePluginStatus } from '@common/composables'

import AdminPageHeader from '@backstage/components/common/AdminPageHeader.vue'
import AdminVersionManagementSection from '@backstage/sections/admin/AdminVersionManagementSection.vue'

const { t } = useI18n()
const message = useMessage()
const { allPlugins, refreshAll, addLog } = useAdminContext()

const { formatDateTime: formatDate } = useDateFormat({ locale: 'zh-CN' })
const { getPluginStatusLabel: getStatusLabel, getPluginStatusType: getStatusType } = usePluginStatus()

const pluginOptions = computed<SelectOption[]>(() => {
  return allPlugins.value.map((plugin) => ({ label: plugin.name, value: plugin.id }))
})

const {
  selectedVersionPluginId,
  versionLoading,
  versionRows,
  versionActionLogs,
  versionReason,
  diffVisible,
  diffTitle,
  diffCode,
  activeVersion,
  canRollback,
  canDeleteVersion,
  fetchVersionData,
  rollbackVersion,
  deleteVersion,
  openDiff,
} = useAdminVersionManagement({
  allPlugins,
  message,
  addLog,
  refreshAll,
})

watch(selectedVersionPluginId, async (pluginId) => {
  if (pluginId) await fetchVersionData(pluginId)
})

onMounted(() => {
  if (selectedVersionPluginId.value) fetchVersionData(selectedVersionPluginId.value)
})
</script>

<template>
  <div>
    <AdminPageHeader 
      :title="t('admin.menu.versions')" 
      @refresh="refreshAll(true)"
    />

    <AdminVersionManagementSection
      :selected-version-plugin-id="selectedVersionPluginId"
      :plugin-options="pluginOptions as any"
      :version-reason="versionReason"
      :active-version="activeVersion"
      :version-loading="versionLoading"
      :version-rows="versionRows"
      :version-action-logs="versionActionLogs"
      :format-date="formatDate"
      :get-status-type="getStatusType"
      :get-status-label="getStatusLabel"
      :can-rollback="canRollback"
      :can-delete-version="canDeleteVersion"
      :on-rollback-version="rollbackVersion"
      :on-delete-version="deleteVersion"
      :on-open-diff="openDiff"
      @update:selected-version-plugin-id="selectedVersionPluginId = $event"
      @update:version-reason="versionReason = $event"
    />

    <NModal v-model:show="diffVisible">
      <NCard style="width: min(980px, calc(100vw - 24px));" :title="diffTitle" closable @close="diffVisible = false">
        <NCode :code="diffCode" language="diff" word-wrap />
      </NCard>
    </NModal>
  </div>
</template>
