<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NSpin,
  useMessage,
} from 'naive-ui'
import { useAuthStore } from '@common/stores/auth'
import { useDateFormat, usePluginStatus } from '@common/composables'
import {
  AdminDashboardSection,
  AdminDownloadStatsSection,
  AdminPluginManagementSection,
  AdminPluginReviewSection,
  AdminReviewManagementSection,
  AdminSystemLogsSection,
  AdminUserManagementSection,
  AdminVersionManagementSection,
} from '@backstage/sections/admin'
import { parseNumber, useAdminPluginManagement, useAdminReviewManagement, useAdminUserManagement, useAdminVersionManagement } from '@backstage/composables'
import { ADMIN_DEFAULT_MODULE, ADMIN_MODULES, ADMIN_RATING_OPTIONS, ADMIN_STATUS_OPTIONS } from '@backstage/constants'
import type { ModuleId, ModuleItem } from '@common/types'

import { useAdminData } from './admin-review-parts/composables/useAdminData'
import { useAdminMetrics } from './admin-review-parts/composables/useAdminMetrics'
import { useAdminRisk } from './admin-review-parts/composables/useAdminRisk'

import AdminSidebar from './admin-review-parts/components/AdminSidebar.vue'
import RiskDetailModal from './admin-review-parts/components/RiskDetailModal.vue'
import DiffViewerModal from './admin-review-parts/components/DiffViewerModal.vue'

const modules = ADMIN_MODULES
const statusOptions = ADMIN_STATUS_OPTIONS
const ratingOptions = ADMIN_RATING_OPTIONS

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const { formatDateTime: formatDate, formatNumber } = useDateFormat({ locale: 'zh-CN' })
const { getPluginStatusLabel: getStatusLabel, getPluginStatusType: getStatusType } = usePluginStatus()

const activeModule = ref<ModuleId>('dashboard')
const defaultModule = ADMIN_DEFAULT_MODULE
const currentModule = computed<ModuleItem>(() => modules.find((item) => item.id === activeModule.value) ?? defaultModule)

const selectedManagePluginId = ref<string | null>(null)
const selectedVersionPluginId = ref<string | null>(null)
const selectedReviewPluginId = ref<string | null>(null)

const {
  booting,
  loadingPending,
  nowLabel,
  allPlugins,
  pendingPlugins,
  reviewOpinionMap,
  adminLogs,
  downloadRecords,
  downloadRange,
  downloadPlugin,
  downloadKeyword,
  adminUsers,
  addLog,
  refreshAll,
  auditPending,
} = useAdminData({
  selectedManagePluginId,
  selectedVersionPluginId,
  selectedReviewPluginId,
  message,
})

const {
  pendingItems,
  totalPlugins,
  totalUsers,
  totalDownloads,
  todayDownloads,
  todayNewPlugins,
  topPlugins,
  updatedPlugins,
  auditRows,
  authorOptions,
  pluginOptions,
  filteredDownloads,
  trendPoints,
} = useAdminMetrics({
  allPlugins,
  pendingPlugins,
  adminUsers,
  downloadRecords,
  downloadRange,
  downloadPlugin,
  downloadKeyword,
})

const {
  riskRows,
  riskModalVisible,
  riskModalData,
  showRiskModal,
} = useAdminRisk(pendingItems)

const {
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

const {
  reviewLoading,
  reviewSummary,
  reviews,
  selectedReviewId,
  selectedReview,
  reviewKeyword,
  ratingFilter,
  replyDraft,
  filteredReviews,
  fetchReviewsForPlugin,
  toggleSpam,
  isSpam,
  deleteReview,
  saveReply,
} = useAdminReviewManagement({
  message,
  addLog,
})

const {
  manageKeyword,
  manageAuthor,
  manageStatus,
  visibilityReason,
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

const {
  userKeyword,
  filteredUsers,
  toggleUserAdmin,
  toggleUserBan,
  isAdminUser,
  isBannedUser,
} = useAdminUserManagement({
  adminUsers,
  message,
  addLog,
})

const moduleBadge = (id: ModuleId) => {
  if (id === 'plugin-review') return pendingItems.value.length || null
  if (id === 'review-management') return reviews.value.length || null
  return null
}

watch(selectedVersionPluginId, async (pluginId) => {
  if (activeModule.value === 'version-management' && pluginId) await fetchVersionData(pluginId)
})

watch(selectedReviewPluginId, async (pluginId) => {
  if (activeModule.value === 'review-management' && pluginId) await fetchReviewsForPlugin(pluginId)
})

watch(activeModule, async (value) => {
  if (value === 'version-management' && selectedVersionPluginId.value) await fetchVersionData(selectedVersionPluginId.value)
  if (value === 'review-management' && selectedReviewPluginId.value) await fetchReviewsForPlugin(selectedReviewPluginId.value)
})

onMounted(async () => {
  try {
    if (!authStore.user) await authStore.fetchUser()
    if (authStore.user?.role !== 'ADMIN') {
      message.error('权限不足：仅管理员可访问')
      router.push('/plugins')
      return
    }
    await refreshAll()
  } finally {
    booting.value = false
  }
})
</script>

<template>
  <div class="admin-console">
    <div class="admin-shell">
      <AdminSidebar
        :modules="modules"
        :active-module="activeModule"
        :now-label="nowLabel"
        :module-badge="moduleBadge"
        @update:active-module="activeModule = $event"
      />

      <main class="admin-main">
        <header class="admin-main-header">
          <div>
            <h1>{{ currentModule.label }}</h1>
            <p>{{ currentModule.desc }}</p>
          </div>
          <NButton type="primary" @click="refreshAll(true)">
            <template #icon><div class="i-ph-arrows-clockwise-bold" /></template>
            刷新数据
          </NButton>
        </header>

        <NAlert
          v-if="activeModule === 'user-management' || activeModule === 'download-stats'"
          type="info"
          class="admin-tip"
          title="说明"
        >
          用户角色变更已接入后端；封禁与下载明细仍为前端演示流程。
        </NAlert>

        <NSpin :show="booting">
          <section v-show="activeModule === 'dashboard'" class="panel p-0">
            <AdminDashboardSection
              :total-plugins="totalPlugins"
              :today-downloads="todayDownloads"
              :today-new-plugins="todayNewPlugins"
              :pending-count="pendingItems.length"
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
          </section>

          <section v-show="activeModule === 'plugin-review'" class="panel p-0">
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
          </section>

          <section v-show="activeModule === 'plugin-management'" class="panel p-0">
            <AdminPluginManagementSection
              :manage-keyword="manageKeyword"
              :manage-author="manageAuthor"
              :manage-status="manageStatus"
              :visibility-reason="visibilityReason"
              :author-options="authorOptions as any"
              :status-options="statusOptions as any"
              :filtered-plugins="filteredPlugins"
              :selected-manage-plugin-id="selectedManagePluginId || ''"
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
              @update:visibility-reason="visibilityReason = $event"
              @update:selected-manage-plugin-id="selectedManagePluginId = $event"
            />
          </section>

          <section v-show="activeModule === 'version-management'" class="panel p-0">
            <AdminVersionManagementSection
              :selected-version-plugin-id="selectedVersionPluginId || ''"
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
          </section>

          <section v-show="activeModule === 'review-management'" class="panel p-0">
            <AdminReviewManagementSection
              :selected-review-plugin-id="selectedReviewPluginId || ''"
              :plugin-options="pluginOptions as any"
              :rating-filter="ratingFilter"
              :rating-options="ratingOptions as any"
              :review-keyword="reviewKeyword"
              :review-summary="reviewSummary"
              :review-loading="reviewLoading"
              :filtered-reviews="filteredReviews"
              :selected-review-id="selectedReviewId"
              :selected-review="selectedReview"
              :reply-draft="replyDraft"
              :format-date="formatDate"
              :is-spam="isSpam"
              :on-toggle-spam="toggleSpam"
              :on-delete-review="deleteReview"
              :on-save-reply="saveReply"
              @update:selected-review-plugin-id="selectedReviewPluginId = $event"
              @update:rating-filter="ratingFilter = $event"
              @update:review-keyword="reviewKeyword = $event"
              @update:selected-review-id="selectedReviewId = $event"
              @update:reply-draft="replyDraft = $event"
            />
          </section>

          <section v-show="activeModule === 'user-management'" class="panel p-0">
            <AdminUserManagementSection
              :user-keyword="userKeyword"
              :filtered-users="filteredUsers"
              :format-date="formatDate"
              :is-admin-user="isAdminUser"
              :is-banned-user="isBannedUser"
              :on-toggle-user-admin="toggleUserAdmin"
              :on-toggle-user-ban="toggleUserBan"
              @update:user-keyword="userKeyword = $event"
            />
          </section>

          <section v-show="activeModule === 'download-stats'" class="panel p-0">
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
          </section>

          <section v-show="activeModule === 'system-logs'" class="panel p-0">
            <AdminSystemLogsSection
              :audit-rows="auditRows"
              :get-status-type="getStatusType"
              :get-status-label="getStatusLabel"
              :format-date="formatDate"
              :admin-logs="adminLogs"
              :selected-version-plugin-id="selectedVersionPluginId || ''"
              :plugin-options="pluginOptions as any"
              :version-loading="versionLoading"
              :version-action-logs="versionActionLogs"
              :on-refresh-version-logs="fetchVersionData"
              @update:selected-version-plugin-id="selectedVersionPluginId = $event"
            />
          </section>
        </NSpin>
      </main>
    </div>

    <RiskDetailModal
      v-model:show="riskModalVisible"
      :data="riskModalData"
    />

    <DiffViewerModal
      v-model:show="diffVisible"
      :title="diffTitle"
      :code="diffCode"
    />
  </div>
</template>

<style scoped>
.admin-console {
  min-height: calc(100vh - 70px);
  margin-top: 70px;
  padding: 20px;
  background:
    radial-gradient(circle at 14% 10%, rgba(15, 118, 110, 0.14), transparent 40%),
    radial-gradient(circle at 85% 12%, rgba(249, 115, 22, 0.14), transparent 42%),
    #f3f7f6;
  font-family: "Space Grotesk", "Plus Jakarta Sans", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.admin-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 14px;
  min-height: calc(100vh - 124px);
}

.admin-main {
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(15, 118, 110, 0.18);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 35px rgba(15, 23, 42, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(15, 118, 110, 0.15);
}

.admin-main-header h1 {
  margin: 0;
  color: #0f172a;
}

.admin-main-header p {
  margin: 4px 0 0;
  color: #64748b;
}

.admin-tip {
  margin: 10px 16px 0;
}

.panel {
  padding: 14px 16px 18px;
}

@media (max-width: 1200px) {
  .admin-shell {
    grid-template-columns: 240px minmax(0, 1fr);
  }
}

@media (max-width: 920px) {
  .admin-console {
    padding: 12px;
  }

  .admin-shell {
    grid-template-columns: 1fr;
  }
}
</style>

