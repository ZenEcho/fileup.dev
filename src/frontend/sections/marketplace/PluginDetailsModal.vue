<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NAvatar,
  NButton,
  NCard,
  NDivider,
  NInput,
  NModal,
  NRate,
  NTag,
} from 'naive-ui'
import { PluginContentPreview } from '@common/ui'
import type { AuthUser, PluginMarketplaceItem, PluginReview } from '@common/types'

const props = defineProps<{
  show: boolean
  selectedPlugin: PluginMarketplaceItem | null
  reviewSummary: {
    total: number
    averageRating: number
  }
  authUser: AuthUser | null
  hasCurrentUserReviewed: boolean
  reviewForm: {
    rating: number
    content: string
  }
  reviewSubmitting: boolean
  reviewsLoading: boolean
  reviews: PluginReview[]
  canCurrentUserReply: boolean
  isCurrentUserAdmin: boolean
  replyDraftMap: Record<string, string>
  replySubmittingId: string | null
  deletingReviewId: string | null
  formatDateTime: (value?: string | null) => string
  onLogin: () => void
  onSubmitReview: () => void
  onSubmitReply: (reviewId: string) => void
  onDeleteReview: (reviewId: string) => void
}>()

const emit = defineEmits<{
  (event: 'update:show', value: boolean): void
}>()

const { t } = useI18n()

const showModel = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value),
})

const detailsTitle = computed(() => {
  if (!props.selectedPlugin) {
    return t('marketplace.detailsTitle')
  }

  return `${props.selectedPlugin.name} v${props.selectedPlugin.version}`
})
</script>

<template>
  <NModal v-model:show="showModel">
    <NCard
      class="max-h-[85vh] overflow-auto"
      style="width: min(900px, calc(100vw - 32px));"
      :title="detailsTitle"
      closable
      @close="showModel = false"
    >
      <PluginContentPreview v-if="selectedPlugin" :content="selectedPlugin.content" show-raw-json />

      <NDivider>{{ t('marketplace.reviewSectionTitle') }}</NDivider>

      <div class="rounded-xl border border-border bg-white/40 p-4 mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <NRate :value="reviewSummary.averageRating" readonly allow-half />
          <span class="font-700 text-1.1rem">{{ reviewSummary.averageRating.toFixed(1) }}</span>
          <span class="text-text-secondary">({{ reviewSummary.total }} {{ t('marketplace.reviewCountSuffix') }})</span>
        </div>
      </div>

      <div class="rounded-xl border border-border bg-white/40 p-4 mb-6">
        <div v-if="authUser" class="flex flex-col gap-3">
          <span class="font-600 text-0.95rem">{{ t('marketplace.submitReview') }}</span>
          <span v-if="hasCurrentUserReviewed" class="text-0.85rem text-text-secondary">{{ t('marketplace.reviewAlreadySubmitted') }}</span>
          <NRate v-model:value="reviewForm.rating" :readonly="hasCurrentUserReviewed" />
          <NInput
            v-model:value="reviewForm.content"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            :maxlength="2000"
            :placeholder="t('marketplace.reviewInputPlaceholder')"
            :disabled="hasCurrentUserReviewed"
            show-count
          />
          <div class="flex justify-end">
            <NButton type="primary" :loading="reviewSubmitting" :disabled="hasCurrentUserReviewed" @click="onSubmitReview">
              {{ t('marketplace.submitReview') }}
            </NButton>
          </div>
        </div>
        <div v-else class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span class="text-text-secondary">{{ t('marketplace.reviewLoginHint') }}</span>
          <NButton type="primary" secondary @click="onLogin">
            {{ t('auth.login') }}
          </NButton>
        </div>
      </div>

      <div v-if="reviewsLoading" class="text-center py-8 text-text-secondary">
        {{ t('admin.loading') }}
      </div>
      <div v-else-if="reviews.length === 0" class="text-center py-8 text-text-secondary">
        {{ t('marketplace.noReviews') }}
      </div>
      <div v-else class="flex flex-col gap-4">
        <div v-for="review in reviews" :key="review.id" class="rounded-xl border border-border bg-white/40 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div class="flex items-center gap-2">
              <NAvatar v-if="review.reviewer.avatar" :src="review.reviewer.avatar" round size="small" />
              <div v-else class="i-ph-user-circle text-1.2rem text-text-secondary" />
              <span class="font-600">{{ review.reviewer.username || t('marketplace.unknownUser') }}</span>
              <NTag v-if="review.reviewer.isAuthor" type="warning" size="small" round>
                {{ t('marketplace.authorBadge') }}
              </NTag>
            </div>

            <div class="flex items-center gap-3 text-0.8rem text-text-secondary">
              <NRate :value="review.rating" readonly />
              <span>{{ formatDateTime(review.createdAt) }}</span>
              <NButton
                v-if="isCurrentUserAdmin"
                text
                type="error"
                :loading="deletingReviewId === review.id"
                @click="onDeleteReview(review.id)"
              >
                {{ t('marketplace.deleteReview') }}
              </NButton>
            </div>
          </div>

          <p class="whitespace-pre-wrap text-0.95rem text-text-main">{{ review.content }}</p>

          <div v-if="review.replies.length > 0" class="mt-3 flex flex-col gap-2">
            <div v-for="reply in review.replies" :key="reply.id" class="rounded-lg border border-primary/25 bg-primary/6 p-3">
              <div class="flex items-center gap-2 mb-1">
                <NAvatar v-if="reply.author.avatar" :src="reply.author.avatar" round size="small" />
                <div v-else class="i-ph-user-circle text-1.1rem text-primary" />
                <span class="font-600">{{ reply.author.username || t('marketplace.authorReplyTitle') }}</span>
                <NTag :type="reply.author.isAuthor ? 'warning' : 'info'" size="small" round>
                  {{ reply.author.isAuthor ? t('marketplace.authorBadge') : t('marketplace.adminBadge') }}
                </NTag>
                <span class="text-0.75rem text-text-secondary">{{ formatDateTime(reply.createdAt) }}</span>
              </div>
              <p class="whitespace-pre-wrap text-0.9rem text-text-main">{{ reply.content }}</p>
            </div>
          </div>

          <div v-if="canCurrentUserReply" class="mt-3 rounded-lg border border-dashed border-primary/40 p-3">
            <div class="text-0.85rem text-text-secondary mb-2">{{ t('marketplace.authorReplyTitle') }}</div>
            <NInput
              v-model:value="replyDraftMap[review.id]"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 4 }"
              :maxlength="2000"
              :placeholder="t('marketplace.replyInputPlaceholder')"
              show-count
            />
            <div class="flex justify-end mt-2">
              <NButton
                type="primary"
                size="small"
                :loading="replySubmittingId === review.id"
                @click="onSubmitReply(review.id)"
              >
                {{ t('marketplace.submitReply') }}
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </NCard>
  </NModal>
</template>
