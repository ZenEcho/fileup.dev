<script setup lang="ts">
import { NButton, NSpace, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import TrendChart from './TrendChart.vue'
import StatCard from '@backstage/components/common/StatCard.vue'
import SectionCard from '@backstage/components/common/SectionCard.vue'

interface RankedPlugin {
  id: string
  name: string
  downloads: number | string | bigint
}

interface UpdatedPlugin {
  id: string
  name: string
  updatedAt: string
}

const props = defineProps<{
  totalPlugins: number
  todayDownloads: number
  todayNewPlugins: number
  pendingCount: number
  totalUsers: number
  downloadRange: 7 | 30
  trendPoints: Array<{
    label: string
    count: number
    height: number
  }>
  topPlugins: RankedPlugin[]
  updatedPlugins: UpdatedPlugin[]
  formatNumber: (value: number) => string
  parseNumber: (value: unknown) => number
  formatDate: (value?: string | null) => string
}>()

const emit = defineEmits<{
  (event: 'update:downloadRange', value: 7 | 30): void
}>()

const setRange = (value: 7 | 30) => {
  emit('update:downloadRange', value)
}

const { t } = useI18n()
</script>

<template>
  <div class="space-y-6">
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard 
        :title="t('admin.dashboard.totalPlugins')" 
        :value="totalPlugins"
        icon="i-ph-puzzle-piece-duotone"
        icon-class="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
      />
      <StatCard 
        :title="t('admin.dashboard.todayDownloads')" 
        :value="todayDownloads"
        icon="i-ph-download-duotone"
        icon-class="bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400"
      />
      <StatCard 
        :title="t('admin.dashboard.todayNewPlugins')" 
        :value="todayNewPlugins"
        icon="i-ph-plus-circle-duotone"
        icon-class="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
      />
      <StatCard 
        :title="t('admin.dashboard.pendingCount')" 
        :value="pendingCount"
        icon="i-ph-clock-duotone"
        icon-class="bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
      />
      <StatCard 
        :title="t('admin.dashboard.totalUsers')" 
        :value="totalUsers"
        icon="i-ph-users-duotone"
        icon-class="bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
      />
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SectionCard class="lg:col-span-2" :title="t('admin.dashboard.trends')">
        <template #header-extra>
          <NSpace>
            <NButton size="small" :type="downloadRange === 7 ? 'primary' : 'default'" @click="setRange(7)">7天</NButton>
            <NButton size="small" :type="downloadRange === 30 ? 'primary' : 'default'" @click="setRange(30)">30天</NButton>
          </NSpace>
        </template>
        <TrendChart :points="trendPoints" />
      </SectionCard>

      <SectionCard :title="t('admin.dashboard.pluginsRanking')">
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

      <SectionCard title="最近更新">
        <ul class="flex flex-col gap-3 m-0 p-0 list-none">
          <li v-for="plugin in updatedPlugins" :key="plugin.id" class="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-700/50 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
            <div>
              <p class="m-0 font-medium text-gray-800 dark:text-gray-200">{{ plugin.name }}</p>
              <small class="text-gray-500">{{ plugin.id }}</small>
            </div>
            <small class="text-gray-400">{{ formatDate(plugin.updatedAt) }}</small>
          </li>
        </ul>
      </SectionCard>
    </div>
  </div>
</template>
