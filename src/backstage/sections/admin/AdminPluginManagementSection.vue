<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NCard, NCollapse, NCollapseItem, NEmpty, NInput, NPopconfirm, NSelect, NTag } from 'naive-ui'
import type { PluginEntity, PluginStatus } from '@common/types'

import type { SelectOption } from 'naive-ui'

const props = defineProps<{
  manageKeyword: string
  manageAuthor: string | null
  manageStatus: 'ALL' | PluginStatus
  authorOptions: SelectOption[]
  statusOptions: SelectOption[]
  filteredPlugins: PluginEntity[]
  selectedManagePluginId: string
  selectedManagePlugin: PluginEntity | null
  formatNumber: (value: number) => string
  parseNumber: (value: unknown) => number
  getStatusType: (status?: PluginStatus) => any
  getStatusLabel: (status?: PluginStatus) => string
  formatDate: (value?: string | null) => string
  onUpdateVisibility: (plugin: PluginEntity, visible: boolean, action: string, mode?: 'FORCE' | 'NORMAL') => void
  onRemovePlugin: (plugin: PluginEntity) => void
}>()

const emit = defineEmits<{
  (event: 'update:manageKeyword', value: string): void
  (event: 'update:manageAuthor', value: string | null): void
  (event: 'update:manageStatus', value: 'ALL' | PluginStatus): void
  (event: 'update:selectedManagePluginId', value: string): void
}>()

const manageKeywordModel = computed({
  get: () => props.manageKeyword,
  set: (value: string) => emit('update:manageKeyword', value),
})

const manageAuthorModel = computed({
  get: () => props.manageAuthor,
  set: (value: string | null) => emit('update:manageAuthor', value),
})

const manageStatusModel = computed({
  get: () => props.manageStatus,
  set: (value: 'ALL' | PluginStatus) => emit('update:manageStatus', value),
})

const selectedManagePluginIdModel = computed({
  get: () => props.selectedManagePluginId,
  set: (value: string) => emit('update:selectedManagePluginId', value),
})
</script>

<template>
  <section class="p-1">
    <div class="flex flex-col md:flex-row gap-3 mb-5">
      <NInput class="flex-1" v-model:value="manageKeywordModel" placeholder="搜索（名称 / ID / 作者）" clearable />
      <NSelect class="w-full md:w-64" v-model:value="manageAuthorModel" :options="authorOptions" placeholder="按作者筛选" clearable />
      <NSelect class="w-full md:w-48" v-model:value="manageStatusModel" :options="statusOptions" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-6 items-start">
      <div class="flex flex-col gap-3 max-h-[calc(100vh-270px)] overflow-y-auto pr-2 custom-scrollbar p-1">
        <button
          v-for="plugin in filteredPlugins"
          :key="plugin.id"
          class="w-full text-left p-4 rounded-xl border transition-all flex justify-between items-start cursor-pointer focus:outline-none outline-none relative overflow-hidden group"
          :class="[
             selectedManagePluginIdModel === plugin.id
              ? 'border-teal-500 shadow-md bg-teal-50 dark:bg-teal-900/40 ring-1 ring-teal-500'
              : 'border-gray-200 dark:border-gray-700 hover:border-teal-500/50 bg-white dark:bg-gray-800'
          ]"
          @click="selectedManagePluginIdModel = plugin.id"
        >
          <!-- Active Indicator line -->
          <div 
            class="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 transition-transform origin-left"
            :class="selectedManagePluginIdModel === plugin.id ? 'scale-x-100' : 'scale-x-0'"
          />
          
          <div class="pl-1">
            <p class="font-semibold m-0 text-gray-800 dark:text-gray-100 mb-1" :class="selectedManagePluginIdModel === plugin.id ? 'text-teal-700 dark:text-teal-400' : ''">{{ plugin.name }}</p>
            <small class="block text-gray-500 mt-0.5">{{ plugin.id }}</small>
            <small class="block text-gray-400 mt-1">作者：{{ plugin.author.username || plugin.authorId }}</small>
          </div>
          <div class="flex flex-col gap-2 items-end shrink-0 z-10 relative">
            <NTag size="small" :type="plugin.isPublic ? 'success' : 'warning'" round>
              {{ plugin.isPublic ? '公开' : '私有' }}
            </NTag>
            <NTag size="small" :type="getStatusType(plugin.versions[0]?.status)" round>
              {{ getStatusLabel(plugin.versions[0]?.status) }}
            </NTag>
          </div>
        </button>
        <NEmpty v-if="!filteredPlugins.length" description="未匹配到插件" class="my-10" />
      </div>

      <NCard v-if="selectedManagePlugin" class="shadow-sm rounded-xl border-gray-100 dark:border-gray-800 h-fit">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <span class="font-bold text-lg text-gray-800 dark:text-gray-100 w-full truncate">{{ selectedManagePlugin.name }}</span>
            <NTag :type="selectedManagePlugin.isPublic ? 'success' : 'warning'" round class="shrink-0">
              {{ selectedManagePlugin.isPublic ? '公开' : '状态私有' }}
            </NTag>
          </div>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6 pb-6 border-b border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
          <div><strong class="text-gray-900 dark:text-gray-100 block mb-1">插件 ID</strong><span class="break-all">{{ selectedManagePlugin.id }}</span></div>
          <div><strong class="text-gray-900 dark:text-gray-100 block mb-1">作者</strong><span class="truncate">{{ selectedManagePlugin.author.username || selectedManagePlugin.authorId }}</span></div>
          <div><strong class="text-gray-900 dark:text-gray-100 block mb-1">下载统计</strong>{{ formatNumber(parseNumber(selectedManagePlugin.downloads)) }}</div>
          <div><strong class="text-gray-900 dark:text-gray-100 block mb-1">当前版本</strong>v{{ selectedManagePlugin.versions[0]?.version || '-' }}</div>
        </div>

        <div class="flex flex-wrap gap-3 mb-6">
          <NButton type="warning" secondary @click="onUpdateVisibility(selectedManagePlugin, false, '强制下架', 'FORCE')">强制下架</NButton>
          <NButton type="success" secondary @click="onUpdateVisibility(selectedManagePlugin, true, '重新上架', 'FORCE')">重新上架</NButton>
          <NButton secondary @click="onUpdateVisibility(selectedManagePlugin, !selectedManagePlugin.isPublic, '修改可见性', 'NORMAL')">切换可见性</NButton>
          <NPopconfirm @positive-click="onRemovePlugin(selectedManagePlugin)">
            <template #trigger><NButton type="error">删除插件</NButton></template>
            删除后不可恢复，确认继续？
          </NPopconfirm>
        </div>

        <div class="mt-4">
          <NCollapse>
            <NCollapseItem title="版本列表" name="versions" class="font-medium">
              <div class="flex flex-col gap-3 mt-3">
                <NCard v-for="version in selectedManagePlugin.versions.slice(0, 10)" :key="version.id" size="small" class="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                  <div class="flex items-center justify-between gap-3 mb-1">
                    <span class="font-semibold text-gray-700 dark:text-gray-200">v{{ version.version }}</span>
                    <NTag :type="getStatusType(version.status)" round size="small">{{ getStatusLabel(version.status) }}</NTag>
                  </div>
                  <small class="text-gray-500">{{ formatDate(version.createdAt) }}</small>
                </NCard>
              </div>
            </NCollapseItem>
          </NCollapse>
        </div>
      </NCard>
      
      <div v-else class="flex items-center justify-center h-[300px] border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-800/10">
        <NEmpty description="请在左侧选择要管理的插件" />
      </div>
    </div>
  </section>
</template>
