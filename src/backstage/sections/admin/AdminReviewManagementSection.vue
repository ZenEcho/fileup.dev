<script setup lang="ts">
import { computed } from 'vue'
import { NAlert, NButton, NCard, NEmpty, NInput, NPopconfirm, NSelect, NSpace, NTag } from 'naive-ui'
import StatCard from '@backstage/components/common/StatCard.vue'

import type { SelectOption } from 'naive-ui'

interface ReviewAuthor {
  userId: string | null
  username: string | null
  avatar: string | null
  isAuthor: boolean
  isAdmin?: boolean
}

interface ReviewReply {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: ReviewAuthor
}

interface ReviewPayload {
  id: string
  pluginId: string
  rating: number
  content: string
  createdAt: string
  updatedAt: string
  reviewer: ReviewAuthor
  replies: ReviewReply[]
  authorReply?: ReviewReply | null
}

interface ReviewSummary {
  total: number
  averageRating: number
}

const props = defineProps<{
  selectedReviewPluginId: string
  pluginOptions: SelectOption[]
  ratingFilter: 'ALL' | 1 | 2 | 3 | 4 | 5
  ratingOptions: SelectOption[]
  reviewKeyword: string
  reviewSummary: ReviewSummary
  reviewLoading: boolean
  filteredReviews: ReviewPayload[]
  selectedReviewId: string
  selectedReview: ReviewPayload | null
  replyDraft: string
  formatDate: (value?: string | null) => string
  isSpam: (reviewId: string) => boolean
  onToggleSpam: (reviewId: string) => void
  onDeleteReview: (review: ReviewPayload) => void
  onSaveReply: () => void
}>()

const emit = defineEmits<{
  (event: 'update:selectedReviewPluginId', value: string): void
  (event: 'update:ratingFilter', value: 'ALL' | 1 | 2 | 3 | 4 | 5): void
  (event: 'update:reviewKeyword', value: string): void
  (event: 'update:selectedReviewId', value: string): void
  (event: 'update:replyDraft', value: string): void
}>()

const selectedReviewPluginIdModel = computed({
  get: () => props.selectedReviewPluginId,
  set: (value: string) => emit('update:selectedReviewPluginId', value),
})

const ratingFilterModel = computed({
  get: () => props.ratingFilter,
  set: (value: 'ALL' | 1 | 2 | 3 | 4 | 5) => emit('update:ratingFilter', value),
})

const reviewKeywordModel = computed({
  get: () => props.reviewKeyword,
  set: (value: string) => emit('update:reviewKeyword', value),
})

const selectedReviewIdModel = computed({
  get: () => props.selectedReviewId,
  set: (value: string) => emit('update:selectedReviewId', value),
})

const replyDraftModel = computed({
  get: () => props.replyDraft,
  set: (value: string) => emit('update:replyDraft', value),
})
</script>

<template>
  <section class="p-1 max-w-[1400px]">
    <div class="flex flex-col md:flex-row gap-3 mb-6">
      <NSelect class="w-full md:w-64" v-model:value="selectedReviewPluginIdModel" :options="pluginOptions"
        placeholder="按插件筛选" />
      <NSelect class="w-full md:w-48" v-model:value="ratingFilterModel" :options="ratingOptions" />
      <NInput class="flex-1" v-model:value="reviewKeywordModel" placeholder="搜索评价内容或评价人" clearable />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard title="评价总数" :value="reviewSummary.total" icon="i-ph-chat-circle-dots-duotone"
        icon-class="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" />
      <StatCard title="平均评分" :value="reviewSummary.averageRating" icon="i-ph-star-duotone"
        icon-class="bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" />
    </div>

    <div v-if="reviewLoading" class="text-center p-10 text-gray-500">加载评价中...</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-6 items-start">
      <div class="flex flex-col gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar p-1">
        <button v-for="review in filteredReviews" :key="review.id"
          class="w-full text-left p-4 rounded-xl border transition-all flex justify-between items-start cursor-pointer focus:outline-none outline-none relative overflow-hidden group"
          :class="[
            selectedReviewIdModel === review.id
              ? 'border-teal-500 shadow-md bg-teal-50 dark:bg-teal-900/40 ring-1 ring-teal-500'
              : 'border-gray-200 dark:border-gray-700 hover:border-teal-500/50 bg-white dark:bg-gray-800',
            isSpam(review.id) ? 'opacity-60 grayscale' : ''
          ]" @click="selectedReviewIdModel = review.id">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-teal-500 transition-transform origin-left"
            :class="selectedReviewIdModel === review.id ? 'scale-x-100' : 'scale-x-0'" />
          <div class="pl-1">
            <p class="font-semibold m-0 text-gray-800 dark:text-gray-100 mb-1"
              :class="selectedReviewIdModel === review.id ? 'text-teal-700 dark:text-teal-400' : ''">{{
                review.reviewer.username || '未知用户' }}</p>
            <small class="block text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{{ review.content }}</small>
            <small class="block text-gray-400 mt-2">{{ formatDate(review.createdAt) }}</small>
          </div>
          <NTag size="small" :type="isSpam(review.id) ? 'error' : 'info'" round class="shrink-0 ml-2 z-10 relative">
            {{ isSpam(review.id) ? '垃圾评价' : `${review.rating} 分` }}
          </NTag>
        </button>
        <NEmpty v-if="!filteredReviews.length" description="暂无评价" class="my-10" />
      </div>

      <NCard v-if="selectedReview" class="shadow-sm rounded-xl border-gray-100 dark:border-gray-800">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <span class="font-bold text-lg">评价详情</span>
            <NSpace>
              <NButton size="small" secondary @click="onToggleSpam(selectedReview.id)">
                {{ isSpam(selectedReview.id) ? '取消垃圾标记' : '标记垃圾评价' }}
              </NButton>
              <NPopconfirm @positive-click="onDeleteReview(selectedReview)">
                <template #trigger>
                  <NButton size="small" type="error" secondary>删除评价</NButton>
                </template>
                确认删除此评价？
              </NPopconfirm>
            </NSpace>
          </div>
        </template>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-sm mb-6 pb-6 border-b border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
          <div><strong class="text-gray-900 dark:text-gray-100 block mb-1">评分</strong>{{ selectedReview.rating }}</div>
          <div><strong class="text-gray-900 dark:text-gray-100 block mb-1">评价人</strong>{{
            selectedReview.reviewer.username ||
            '未知用户' }}</div>
          <div><strong class="text-gray-900 dark:text-gray-100 block mb-1">创建时间</strong>{{
            formatDate(selectedReview.createdAt)
            }}</div>
          <div><strong class="text-gray-900 dark:text-gray-100 block mb-1">更新时间</strong>{{
            formatDate(selectedReview.updatedAt)
            }}</div>
        </div>

        <NAlert type="default" class="mb-6 rounded-lg">{{ selectedReview.content }}</NAlert>

        <h4 class="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 m-0">作者回复</h4>
        <NInput v-model:value="replyDraftModel" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" maxlength="2000"
          show-count placeholder="查看或修改回复" class="mb-3" />
        <NButton type="primary" @click="onSaveReply">保存回复</NButton>

        <div class="flex flex-col gap-3 mt-6">
          <NCard v-for="reply in selectedReview.replies" :key="reply.id" size="small"
            class="bg-gray-50/50 dark:bg-gray-800/30 rounded-lg shadow-sm border-gray-100 dark:border-gray-800">
            <div class="flex items-center justify-between gap-3 mb-2">
              <strong class="font-medium text-gray-800 dark:text-gray-200">{{ reply.author.username || '未知用户'
                }}</strong>
              <NTag :type="reply.author.isAdmin ? 'warning' : 'info'" size="small" round>
                {{ reply.author.isAdmin ? '管理员' : (reply.author.isAuthor ? '作者' : '回复') }}
              </NTag>
            </div>
            <p class="text-gray-600 dark:text-gray-300 text-sm m-0 mt-1 mb-2">{{ reply.content }}</p>
            <small class="text-gray-400">{{ formatDate(reply.createdAt) }}</small>
          </NCard>
        </div>
      </NCard>

      <div v-else
        class="flex items-center justify-center h-[300px] border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/30 dark:bg-gray-800/10">
        <NEmpty description="请在左侧选择要查看的评价" />
      </div>
    </div>
  </section>
</template>
