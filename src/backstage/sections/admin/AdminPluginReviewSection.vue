<script setup lang="ts">
import { NButton, NCard, NEmpty, NInput, NSpace, NTabPane, NTabs, NTag } from 'naive-ui'
import { PluginContentPreview } from '@common/ui'
import type { AuditHistoryRow, PendingItem, PluginStatus } from '@common/types'

interface RiskRow {
  key: string
  pluginName: string
  pluginId: string
  version: string
  score: number
  level: string
  rules: string[]
}

defineProps<{
  loadingPending: boolean
  pendingItems: PendingItem[]
  reviewOpinionMap: Record<string, string>
  auditRows: AuditHistoryRow[]
  riskRows: RiskRow[]
  formatDate: (value?: string | null) => string
  getStatusType: (status?: PluginStatus) => 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  getStatusLabel: (status?: PluginStatus) => string
  onShowRiskModal: (key: string) => void
  onAuditPending: (item: PendingItem, status: PluginStatus) => void
}>()
</script>

<template>
  <section class="p-1">
    <NTabs type="segment" animated>
      <NTabPane name="pending" tab="待审核版本">
        <div v-if="loadingPending" class="text-center p-10 text-gray-500">加载中...</div>
        <NEmpty v-else-if="pendingItems.length === 0" description="暂无待审核版本" class="my-10" />
        <div v-else class="flex flex-col gap-4 mt-3">
          <NCard v-for="item in pendingItems" :key="item.key" class="shadow-sm rounded-xl">
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <div>
                  <strong class="text-base">{{ item.plugin.name }}</strong>
                  <small class="block text-gray-500">{{ item.plugin.id }}</small>
                </div>
                <NSpace>
                  <NTag type="warning" round>待审核</NTag>
                  <NTag type="info" round>v{{ item.version.version }}</NTag>
                </NSpace>
              </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-4 text-gray-600 dark:text-gray-300">
              <div><strong>作者：</strong>{{ item.plugin.author.username || item.plugin.authorId }}</div>
              <div><strong>提交时间：</strong>{{ formatDate(item.version.createdAt) }}</div>
              <div><strong>更新日志：</strong>{{ item.version.changelog || '-' }}</div>
              <div><strong>审核意见：</strong>支持填写并进入日志</div>
            </div>

            <NInput
              v-model:value="reviewOpinionMap[item.key]"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              maxlength="500"
              show-count
              placeholder="填写审核意见"
              class="mb-4"
            />

            <PluginContentPreview :content="item.content" show-raw-json />

            <template #action>
              <NSpace justify="end">
                <NButton size="small" @click="onShowRiskModal(item.key)">风险详情</NButton>
                <NButton type="warning" secondary @click="onAuditPending(item, 'CHANGES_REQUIRED')">打回修改</NButton>
                <NButton type="error" secondary @click="onAuditPending(item, 'REJECTED')">拒绝通过</NButton>
                <NButton type="success" @click="onAuditPending(item, 'APPROVED')">审核通过</NButton>
              </NSpace>
            </template>
          </NCard>
        </div>
      </NTabPane>

      <NTabPane name="history" tab="审核历史">
        <div class="flex flex-col gap-3 mt-3">
          <NCard v-for="row in auditRows" :key="row.key" size="small" class="shadow-sm rounded-lg hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between gap-3 mb-2">
              <div>
                <p class="font-medium m-0">{{ row.pluginName }} <span class="text-gray-400 text-sm">({{ row.pluginId }})</span></p>
                <small class="text-gray-500">v{{ row.version }} · {{ formatDate(row.createdAt) }}</small>
              </div>
              <NTag :type="getStatusType(row.status)" round size="small">{{ getStatusLabel(row.status) }}</NTag>
            </div>
            <p class="text-gray-500 dark:text-gray-400 text-sm m-0 mt-1">审核员：{{ row.auditor }}</p>
            <p class="text-gray-500 dark:text-gray-400 text-sm m-0 mt-0.5">日志：{{ row.auditLog }}</p>
          </NCard>
        </div>
      </NTabPane>

      <NTabPane name="risk" tab="风险检测">
        <div class="flex flex-col gap-3 mt-3">
          <NCard v-for="row in riskRows" :key="row.key" size="small" class="shadow-sm rounded-lg">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="font-medium m-0">{{ row.pluginName }} · v{{ row.version }}</p>
                <small class="text-gray-500">{{ row.pluginId }}</small>
              </div>
              <div class="flex items-center gap-3">
                <NTag :type="row.level === 'HIGH' ? 'error' : (row.level === 'MEDIUM' ? 'warning' : 'success')" round size="small">
                  {{ row.level }} / {{ row.score }}
                </NTag>
                <NButton size="small" @click="onShowRiskModal(row.key)">查看片段</NButton>
              </div>
            </div>
            <p class="text-gray-500 dark:text-gray-400 text-sm m-0 mt-2">
              可疑规则：{{ row.rules.length ? row.rules.join('、') : '未命中' }}
            </p>
          </NCard>
        </div>
      </NTabPane>
    </NTabs>
  </section>
</template>
