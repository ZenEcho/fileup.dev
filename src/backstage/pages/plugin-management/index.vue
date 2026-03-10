<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, type SelectOption } from 'naive-ui'
import { useAdminContext } from '@backstage/composables/useAdminContext'
import { useAdminPluginManagement } from '@backstage/composables'
import { useDateFormat, usePluginStatus } from '@common/composables'
import { ADMIN_STATUS_OPTIONS } from '@backstage/constants'
import { parseNumber } from '@backstage/composables'

import AdminPageHeader from '@backstage/components/common/AdminPageHeader.vue'
import AdminPluginManagementSection from '@backstage/sections/admin/AdminPluginManagementSection.vue'

const { t } = useI18n()
const message = useMessage()
const { allPlugins, refreshAll, addLog } = useAdminContext()

const { formatDateTime: formatDate, formatNumber } = useDateFormat({ locale: 'zh-CN' })
const { getPluginStatusLabel: getStatusLabel, getPluginStatusType: getStatusType } = usePluginStatus()

const authorOptions = computed<SelectOption[]>(() => {
  const map = new Map<string, string>()
  allPlugins.value.forEach((plugin) => {
    map.set(plugin.authorId, plugin.author.username || plugin.authorId)
  })
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
})

const statusOptions = ADMIN_STATUS_OPTIONS

const {
  manageKeyword,
  manageAuthor,
  manageStatus,
  selectedManagePluginId,
  filteredPlugins,
  selectedManagePlugin,
  updateVisibility,
  removePlugin,
} = useAdminPluginManagement({
  allPlugins,
  message,
  addLog,
  refreshAll,
})
</script>

<template>
  <div>
    <AdminPageHeader 
      :title="t('admin.menu.plugins')" 
      @refresh="refreshAll(true)"
    />

    <AdminPluginManagementSection
      :manage-keyword="manageKeyword"
      :manage-author="manageAuthor"
      :manage-status="manageStatus"
      :author-options="authorOptions"
      :status-options="statusOptions as any"
      :filtered-plugins="filteredPlugins"
      :selected-manage-plugin-id="selectedManagePluginId"
      :selected-manage-plugin="selectedManagePlugin"
      :format-number="formatNumber"
      :parse-number="parseNumber"
      :get-status-type="getStatusType"
      :get-status-label="getStatusLabel"
      :format-date="formatDate"
      :on-update-visibility="updateVisibility"
      :on-remove-plugin="removePlugin"
      @update:manage-keyword="manageKeyword = $event"
      @update:manage-author="manageAuthor = $event"
      @update:manage-status="manageStatus = $event"
      @update:selected-manage-plugin-id="selectedManagePluginId = $event"
    />
  </div>
</template>
