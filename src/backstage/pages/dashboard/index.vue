<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminContext } from '@backstage/composables/useAdminContext'
import AdminPageHeader from '@backstage/components/common/AdminPageHeader.vue'
import AdminDashboardSection from '@backstage/sections/admin/AdminDashboardSection.vue'
import { useDateFormat } from '@common/composables'
import { parseNumber } from '@backstage/composables'

const { t } = useI18n()
const { allPlugins, adminUsers, downloadRecords, refreshAll, pendingPlugins } = useAdminContext()
const { formatDateTime: formatDate, formatNumber, isToday } = useDateFormat({ locale: 'zh-CN' })

const downloadRange = ref<7 | 30>(7)

const totalPlugins = computed(() => allPlugins.value.length)
const totalUsers = computed(() => adminUsers.value.length)
const todayDownloads = computed(() => downloadRecords.value.filter((item) => isToday(item.downloadedAt)).reduce((sum, item) => sum + item.count, 0))
const todayNewPlugins = computed(() => allPlugins.value.filter((plugin) => isToday(plugin.createdAt)).length)

const pendingItemsCount = computed(() => {
  return pendingPlugins.value.flatMap((plugin) => plugin.versions.filter((v) => v.status === 'PENDING')).length
})

const topPlugins = computed(() => {
  return [...allPlugins.value].sort((a, b) => parseNumber(b.downloads) - parseNumber(a.downloads)).slice(0, 8)
})

const updatedPlugins = computed(() => {
  return [...allPlugins.value].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8)
})

const trendPoints = computed(() => {
  const days = downloadRange.value
  const now = new Date()
  const buckets = new Map<string, number>()
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    buckets.set(d.toISOString().slice(0, 10), 0)
  }
  downloadRecords.value.forEach((item) => {
    const key = item.downloadedAt.slice(0, 10)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + item.count)
  })
  const rows = Array.from(buckets.entries()).map(([key, count]) => ({
    label: key.slice(5).replace('-', '/'),
    count,
  }))
  const max = Math.max(1, ...rows.map((row) => row.count))
  return rows.map((row) => ({ ...row, height: Math.max(8, Math.round((row.count / max) * 100)) }))
})
</script>

<template>
  <div>
    <AdminPageHeader 
      :title="t('admin.dashboard.title')" 
      :desc="t('admin.dashboard.desc')"
      @refresh="refreshAll(true)"
    />

    <AdminDashboardSection
      :total-plugins="totalPlugins"
      :today-downloads="todayDownloads"
      :today-new-plugins="todayNewPlugins"
      :pending-count="pendingItemsCount"
      :total-users="totalUsers"
      :download-range="downloadRange"
      :trend-points="trendPoints"
      :top-plugins="topPlugins"
      :updated-plugins="updatedPlugins"
      :format-number="formatNumber"
      :parse-number="parseNumber"
      :format-date="formatDate"
      @update:download-range="downloadRange = $event"
    />
  </div>
</template>
