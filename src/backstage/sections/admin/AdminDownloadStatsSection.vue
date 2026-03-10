<script setup lang="ts">
import { computed } from 'vue'
import { NInput, NSelect, NTag } from 'naive-ui'
import TrendChart from './TrendChart.vue'
import StatCard from '@backstage/components/common/StatCard.vue'
import SectionCard from '@backstage/components/common/SectionCard.vue'
import type { PluginEntity } from '@common/types'

import type { SelectOption } from 'naive-ui'

interface DownloadRow {
  id: string
  downloadedAt: string
  pluginName: string
  ip: string
  count: number
}

const props = defineProps<{
  totalDownloads: number
  todayDownloads: number
  topPlugins: PluginEntity[]
  pluginOptions: SelectOption[]
  downloadPlugin: string | null
  downloadKeyword: string
  downloadRange: 7 | 30
  filteredDownloads: DownloadRow[]
  trendPoints: Array<{ label: string; count: number; height: number }>
  formatNumber: (value: number) => string
  parseNumber: (value: unknown) => number
  formatDate: (value?: string | null) => string
}>()

const emit = defineEmits<{
  (event: 'update:downloadPlugin', value: string | null): void
  (event: 'update:downloadKeyword', value: string): void
  (event: 'update:downloadRange', value: 7 | 30): void
}>()

const downloadPluginModel = computed({
  get: () => props.downloadPlugin,
  set: (value: string | null) => emit('update:downloadPlugin', value),
})

const downloadKeywordModel = computed({
  get: () => props.downloadKeyword,
  set: (value: string) => emit('update:downloadKeyword', value),
})

const downloadRangeModel = computed({
  get: () => props.downloadRange,
  set: (value: 7 | 30) => emit('update:downloadRange', value),
})
</script>

<template>
  <section class="p-1 space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatCard 
        title="全平台下载" 
        :value="totalDownloads"
        icon="i-ph-download-simple-duotone"
        icon-class="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
      />
      <StatCard 
        title="今日下载" 
        :value="todayDownloads"
        icon="i-ph-trend-up-duotone"
        icon-class="bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <SectionCard title="下载趋势">
          <div class="flex flex-col md:flex-row gap-3 mb-5">
            <NSelect class="w-full md:w-64" v-model:value="downloadPluginModel" :options="pluginOptions" clearable placeholder="按插件筛选" />
            <NInput class="flex-1" v-model:value="downloadKeywordModel" clearable placeholder="按 IP / 插件 / 时间搜索" />
            <NSelect
              class="w-full md:w-32"
              v-model:value="downloadRangeModel"
              :options="[
                { label: '近 7 天', value: 7 },
                { label: '近 30 天', value: 30 }
              ]"
            />
          </div>
          <TrendChart :points="trendPoints" />
        </SectionCard>

        <SectionCard title="下载明细" no-padding>
          <div class="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
            <div class="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 font-medium text-gray-500 dark:text-gray-400 text-sm">
              <span>时间</span>
              <span>插件</span>
              <span>来源 IP</span>
              <span>次数</span>
            </div>
            <div class="max-h-[400px] overflow-y-auto w-full custom-scrollbar">
              <div 
                v-for="row in filteredDownloads" 
                :key="row.id" 
                class="grid grid-cols-4 gap-4 p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors text-sm text-gray-700 dark:text-gray-300"
              >
                <span>{{ formatDate(row.downloadedAt) }}</span>
                <span class="truncate">{{ row.pluginName }}</span>
                <span class="font-mono text-xs opacity-80">{{ row.ip }}</span>
                <span class="font-medium">{{ row.count }}</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div class="lg:col-span-1">
        <SectionCard title="插件下载排行">
          <ul class="flex flex-col gap-3 m-0 p-0 list-none">
            <li v-for="(plugin, index) in topPlugins" :key="plugin.id" class="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-700/50 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
              <div>
                <p class="m-0 font-medium text-gray-800 dark:text-gray-200">{{ index + 1 }}. {{ plugin.name }}</p>
                <small class="text-gray-500">{{ plugin.id }}</small>
              </div>
              <NTag type="info" round size="small">{{ formatNumber(parseNumber(plugin.downloads)) }}</NTag>
            </li>
          </ul>
        </SectionCard>
      </div>
    </div>
  </section>
</template>
