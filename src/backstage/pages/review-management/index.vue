<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SelectOption } from 'naive-ui'
import { useMessage } from 'naive-ui'

import { useAdminContext } from '@backstage/composables/useAdminContext'
import { useAdminReviewManagement } from '@backstage/composables'
import { useDateFormat } from '@common/composables'
import { ADMIN_RATING_OPTIONS } from '@backstage/constants'

import AdminPageHeader from '@backstage/components/common/AdminPageHeader.vue'
import AdminReviewManagementSection from '@backstage/sections/admin/AdminReviewManagementSection.vue'

const { t } = useI18n()
const message = useMessage()
const { allPlugins, addLog, refreshAll } = useAdminContext()
const { formatDateTime: formatDate } = useDateFormat({ locale: 'zh-CN' })

const ratingOptions = ADMIN_RATING_OPTIONS

const pluginOptions = computed<SelectOption[]>(() => {
  return allPlugins.value.map((plugin) => ({ label: plugin.name, value: plugin.id }))
})

const {
  selectedReviewPluginId,
  reviewLoading,
  reviewSummary,
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

watch(selectedReviewPluginId, async (pluginId) => {
  if (pluginId) await fetchReviewsForPlugin(pluginId)
})

onMounted(() => {
  if (!selectedReviewPluginId.value && allPlugins.value && allPlugins.value.length > 0) {
    selectedReviewPluginId.value = allPlugins.value[0]?.id || ''
  }
  if (selectedReviewPluginId.value) {
    fetchReviewsForPlugin(selectedReviewPluginId.value)
  }
})
</script>

<template>
  <div>
    <AdminPageHeader :title="t('admin.menu.comments')" @refresh="refreshAll(true)" />

    <AdminReviewManagementSection :selected-review-plugin-id="selectedReviewPluginId"
      :plugin-options="pluginOptions as any" :rating-filter="ratingFilter" :rating-options="ratingOptions as any"
      :review-keyword="reviewKeyword" :review-summary="reviewSummary" :review-loading="reviewLoading"
      :filtered-reviews="filteredReviews" :selected-review-id="selectedReviewId" :selected-review="selectedReview"
      :reply-draft="replyDraft" :format-date="formatDate" :is-spam="isSpam" :on-toggle-spam="toggleSpam"
      :on-delete-review="deleteReview" :on-save-reply="saveReply"
      @update:selected-review-plugin-id="selectedReviewPluginId = $event" @update:rating-filter="ratingFilter = $event"
      @update:review-keyword="reviewKeyword = $event" @update:selected-review-id="selectedReviewId = $event"
      @update:reply-draft="replyDraft = $event" />
  </div>
</template>
