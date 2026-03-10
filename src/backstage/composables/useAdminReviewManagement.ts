import { computed, ref, watch } from 'vue'
import type { MessageApi } from 'naive-ui'
import { deletePluginReview, fetchPluginReviews, upsertPluginReviewReply } from '@common/api'
import type { AdminLog, PluginReview, ReviewSummary } from '@common/types'
import type { AdminRatingFilter } from '@backstage/constants'
import { parseNumber } from './adminHelpers'

type AddLogFn = (
  category: AdminLog['category'],
  action: string,
  target: string,
  result: AdminLog['result'],
  detail: string
) => void

interface UseAdminReviewManagementOptions {
  message: MessageApi
  addLog: AddLogFn
}

export function useAdminReviewManagement(options: UseAdminReviewManagementOptions) {
  const { message, addLog } = options

  const selectedReviewPluginId = ref('')
  const reviewLoading = ref(false)
  const reviewSummary = ref<ReviewSummary>({ total: 0, averageRating: 0 })
  const reviews = ref<PluginReview[]>([])
  const selectedReviewId = ref('')
  const reviewKeyword = ref('')
  const ratingFilter = ref<AdminRatingFilter>('ALL')
  const replyDraft = ref('')
  const spamReviewIds = ref<string[]>([])

  const selectedReview = computed(() => {
    return reviews.value.find((review) => review.id === selectedReviewId.value) || null
  })

  const filteredReviews = computed(() => {
    const keyword = reviewKeyword.value.trim().toLowerCase()
    return reviews.value.filter((review) => {
      const matchRating = ratingFilter.value === 'ALL' || review.rating === ratingFilter.value
      const matchKeyword = !keyword || review.content.toLowerCase().includes(keyword) || (review.reviewer.username || '').toLowerCase().includes(keyword)
      return matchRating && matchKeyword
    })
  })

  const fetchReviewsForPlugin = async (pluginId: string) => {
    if (!pluginId) return
    reviewLoading.value = true
    try {
      const res = await fetchPluginReviews(pluginId)
      reviewSummary.value = {
        total: parseNumber(res.data?.summary?.total),
        averageRating: Number(parseNumber(res.data?.summary?.averageRating).toFixed(2)),
      }
      reviews.value = Array.isArray(res.data?.reviews) ? res.data.reviews : []
      if (!reviews.value.some((item) => item.id === selectedReviewId.value)) {
        selectedReviewId.value = reviews.value[0]?.id || ''
      }
    } catch {
      message.error('加载评价失败')
    } finally {
      reviewLoading.value = false
    }
  }

  const toggleSpam = (reviewId: string) => {
    const set = new Set(spamReviewIds.value)
    const hasReview = set.has(reviewId)
    if (hasReview) set.delete(reviewId)
    else set.add(reviewId)
    spamReviewIds.value = Array.from(set)
    addLog('review', hasReview ? '取消垃圾标记' : '标记垃圾评价', reviewId, 'SUCCESS', '前端标记')
  }

  const isSpam = (reviewId: string) => spamReviewIds.value.includes(reviewId)

  const deleteReview = async (review: PluginReview) => {
    if (!selectedReviewPluginId.value) return
    try {
      await deletePluginReview(selectedReviewPluginId.value, review.id)
      addLog('review', '删除评价', review.id, 'SUCCESS', '管理员删除')
      message.success('评价已删除')
      await fetchReviewsForPlugin(selectedReviewPluginId.value)
    } catch {
      message.error('删除评价失败')
    }
  }

  const saveReply = async () => {
    if (!selectedReviewPluginId.value || !selectedReview.value) return
    const content = replyDraft.value.trim()
    if (!content) return message.warning('请输入回复内容')
    try {
      await upsertPluginReviewReply(selectedReviewPluginId.value, selectedReview.value.id, { content })
      addLog('review', '修改回复', selectedReview.value.id, 'SUCCESS', content)
      message.success('回复已保存')
      await fetchReviewsForPlugin(selectedReviewPluginId.value)
    } catch {
      message.error('回复保存失败')
    }
  }

  watch(filteredReviews, (rows) => {
    if (!rows.length) {
      selectedReviewId.value = ''
      return
    }
    if (!rows.some((row) => row.id === selectedReviewId.value)) {
      selectedReviewId.value = rows[0]!.id
    }
  })

  watch(selectedReview, (review) => {
    replyDraft.value = review?.authorReply?.content || ''
  }, { immediate: true })

  return {
    selectedReviewPluginId,
    reviewLoading,
    reviewSummary,
    reviews,
    selectedReviewId,
    reviewKeyword,
    ratingFilter,
    replyDraft,
    selectedReview,
    filteredReviews,
    fetchReviewsForPlugin,
    toggleSpam,
    isSpam,
    deleteReview,
    saveReply,
  }
}
