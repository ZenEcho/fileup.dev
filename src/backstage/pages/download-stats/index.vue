<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SelectOption } from 'naive-ui'
import { NAlert } from 'naive-ui'

import { useAdminContext } from '@backstage/composables/useAdminContext'
import { useDateFormat } from '@common/composables'
import { parseNumber } from '@backstage/composables'

import AdminPageHeader from '@backstage/components/common/AdminPageHeader.vue'
import AdminDownloadStatsSection from '@backstage/sections/admin/AdminDownloadStatsSection.vue'

const { t } = useI18n()
const { allPlugins, downloadRecords, refreshAll } = useAdminContext()
const { formatDateTime: formatDate, formatNumber, isToday } = useDateFormat({ locale: 'zh-CN' })

const downloadRange = ref<7 | 30>(7)
const downloadPlugin = ref<string | null>(null)
const downloadKeyword = ref('')

const pluginOptions = computed<SelectOption[]>(() => {
  return allPlugins.value.map((plugin) => ({ label: plugin.name, value: plugin.id }))
})

const totalDownloads = computed(() => allPlugins.value.reduce((sum, plugin) => sum + parseNumber(plugin.downloads), 0))
const todayDownloads = computed(() => downloadRecords.value.filter((item) => isToday(item.downloadedAt)).reduce((sum, item) => sum + item.count, 0))

const topPlugins = computed(() => {
  return [...allPlugins.value].sort((a, b) => parseNumber(b.downloads) - parseNumber(a.downloads)).slice(0, 8)
})

const filteredDownloads = computed(() => {
  const keyword = downloadKeyword.value.trim().toLowerCase()
  const now = new Date()
  const min = new Date(now)
  min.setDate(min.getDate() - downloadRange.value + 1)
  return downloadRecords.value.filter((item) => {
    const time = new Date(item.downloadedAt).getTime()
    const matchRange = time >= min.getTime()
    const matchPlugin = !downloadPlugin.value || item.pluginId === downloadPlugin.value
    const matchKeyword = !keyword ||
      item.ip.toLowerCase().includes(keyword) ||
      item.pluginName.toLowerCase().includes(keyword) ||
      item.downloadedAt.toLowerCase().includes(keyword)
    return matchRange && matchPlugin && matchKeyword
  }).sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime())
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
      :title="t('admin.menu.downloads')" 
      @refresh="refreshAll(true)"
    />

    <NAlert type="info" class="mb-4">
      下载统计目前为模拟数据，后续需接入专门的时间序列服务。
    </NAlert>

    <AdminDownloadStatsSection
      :total-downloads="totalDownloads"
      :today-downloads="todayDownloads"
      :top-plugins="topPlugins"
      :plugin-options="pluginOptions as any"
      :download-plugin="downloadPlugin"
      :download-keyword="downloadKeyword"
      :download-range="downloadRange"
      :filtered-downloads="filteredDownloads"
      :trend-points="trendPoints"
      :format-number="formatNumber"
      :parse-number="parseNumber"
      :format-date="formatDate"
      @update:download-plugin="downloadPlugin = $event"
      @update:download-keyword="downloadKeyword = $event"
      @update:download-range="downloadRange = $event"
    />
  </div>
</template>
