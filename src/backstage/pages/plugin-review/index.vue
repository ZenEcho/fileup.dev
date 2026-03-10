<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage, NModal, NCard, NAlert, NCode } from 'naive-ui'
import { useAdminContext } from '@backstage/composables/useAdminContext'
import { useDateFormat, usePluginStatus } from '@common/composables'
import { analyzePluginRisk } from '@backstage/composables'
import { auditPluginVersion } from '@common/api'
import type { PendingItem, PluginStatus } from '@common/types'

import AdminPageHeader from '@backstage/components/common/AdminPageHeader.vue'
import AdminPluginReviewSection from '@backstage/sections/admin/AdminPluginReviewSection.vue'

const { t } = useI18n()
const message = useMessage()
const { allPlugins, pendingPlugins, loadingPending, refreshAll, addLog } = useAdminContext()
const { formatDateTime: formatDate } = useDateFormat({ locale: 'zh-CN' })
const { getPluginStatusLabel: getStatusLabel, getPluginStatusType: getStatusType } = usePluginStatus()

const reviewOpinionMap = reactive<Record<string, string>>({})
const riskModalVisible = ref(false)
const riskModalData = ref<{ title: string; score: number; level: string; rules: string[]; script: string } | null>(null)

const pendingItems = computed<PendingItem[]>(() => {
  return pendingPlugins.value.flatMap((plugin) => {
    return plugin.versions
      .filter((version) => version.status === 'PENDING')
      .map((version) => ({
        key: `${plugin.id}:${version.version}`,
        plugin,
        version,
        content: version.content || {}
      }))
  })
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

const riskRows = computed(() => {
  return pendingItems.value.map((item) => {
    const risk = analyzePluginRisk(item.content)
    return {
      key: item.key,
      pluginName: item.plugin.name,
      pluginId: item.plugin.id,
      version: item.version.version,
      score: risk.score,
      level: risk.level,
      rules: risk.rules,
      script: risk.script,
    }
  })
})

const showRiskModal = (key: string) => {
  const row = riskRows.value.find((item) => item.key === key)
  if (!row) return
  riskModalData.value = {
    title: `${row.pluginName} v${row.version}`,
    score: row.score,
    level: row.level,
    rules: row.rules,
    script: row.script,
  }
  riskModalVisible.value = true
}

const auditPending = async (item: PendingItem, status: PluginStatus) => {
  if (status === 'PENDING') return
  try {
    await auditPluginVersion(item.plugin.id, item.version.version, status)
    addLog('audit', status === 'APPROVED' ? '审核通过' : '审核拒绝', `${item.plugin.id}@${item.version.version}`, 'SUCCESS', reviewOpinionMap[item.key] || '无意见')
    message.success(status === 'APPROVED' ? '审核通过成功' : '审核拒绝成功')
    await refreshAll()
  } catch (error) {
    addLog('audit', status === 'APPROVED' ? '审核通过' : '审核拒绝', `${item.plugin.id}@${item.version.version}`, 'FAILED', String((error as Error).message || 'Unknown'))
    message.error('审核失败')
  }
}
</script>

<template>
  <div>
    <AdminPageHeader 
      :title="t('admin.reviewPage.title')" 
      :desc="t('admin.reviewPage.desc')"
      @refresh="refreshAll(true)"
    />

    <AdminPluginReviewSection
      :loading-pending="loadingPending"
      :pending-items="pendingItems"
      :review-opinion-map="reviewOpinionMap"
      :audit-rows="auditRows"
      :risk-rows="riskRows"
      :format-date="formatDate"
      :get-status-type="getStatusType"
      :get-status-label="getStatusLabel"
      :on-show-risk-modal="showRiskModal"
      :on-audit-pending="auditPending"
    />

    <NModal v-model:show="riskModalVisible">
      <NCard style="width: min(920px, calc(100vw - 24px));" title="风险详情" closable @close="riskModalVisible = false">
        <template v-if="riskModalData">
          <div class="meta-grid mb-3">
            <div><strong>插件版本：</strong>{{ riskModalData.title }}</div>
            <div><strong>风险分：</strong>{{ riskModalData.score }}</div>
            <div><strong>风险等级：</strong>{{ riskModalData.level }}</div>
            <div><strong>命中规则：</strong>{{ riskModalData.rules.length || 0 }}</div>
          </div>
          <NAlert type="warning" class="mb-3">{{ riskModalData.rules.length ? riskModalData.rules.join(' / ') : '未命中明显风险规则' }}</NAlert>
          <NCode :code="riskModalData.script || '// 未找到脚本内容'" language="javascript" word-wrap />
        </template>
      </NCard>
    </NModal>
  </div>
</template>
