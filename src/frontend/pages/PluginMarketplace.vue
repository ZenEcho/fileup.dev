<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  NAlert,
  NAvatar,
  NButton,
  NDropdown,
  NInput,
  NSelect,
  useMessage,
} from 'naive-ui'
import { useAuthStore } from '@common/stores/auth'
import { createPluginReview, deletePluginReview, fetchPluginList, fetchPluginReviews as fetchPluginReviewsApi, recordPluginDownload, upsertPluginReviewReply } from '@common/api'
import { useDateFormat } from '@common/composables'
import { MarketplaceGridSection, PluginDetailsModal } from '@frontend/sections/marketplace'
import type { PluginEntity, PluginMarketplaceItem, PluginReview } from '@common/types'
import type { PluginKind } from '@common/utils/plugin'
import { getPluginAuthorName, validatePluginContent } from '@common/utils/plugin'

const { t } = useI18n()
const message = useMessage()
const router = useRouter()
const authStore = useAuthStore()
const { formatDateTime } = useDateFormat()

type PluginMeta = PluginMarketplaceItem
type SortBy = 'popular' | 'newest'
type EnabledFilter = 'all' | 'enabled' | 'disabled'
type InstalledFilter = 'all' | 'installed' | 'uninstalled'
type KindFilter = 'all' | PluginKind

const pluginKindOrder: PluginKind[] = ['uploader', 'site-detector', 'editor-adapter']

const plugins = ref<PluginMeta[]>([])
const loading = ref(false)
const searchQuery = ref('')
const sortBy = ref<SortBy>('popular')
const enabledFilter = ref<EnabledFilter>('all')
const installedFilter = ref<InstalledFilter>('all')
const kindFilter = ref<KindFilter>('all')
const isExtensionInstalled = ref(false)
const selectedPlugin = ref<PluginMeta | null>(null)
const reviews = ref<PluginReview[]>([])
const reviewsLoading = ref(false)
const reviewSubmitting = ref(false)
const replySubmittingId = ref<string | null>(null)
const deletingReviewId = ref<string | null>(null)
const reviewSummary = ref({
  total: 0,
  averageRating: 0,
})
const reviewForm = ref({
  rating: 5,
  content: '',
})
const replyDraftMap = ref<Record<string, string>>({})

const resetReviewForm = () => {
  reviewForm.value = {
    rating: 5,
    content: '',
  }
}

const closeDetails = () => {
  selectedPlugin.value = null
  reviews.value = []
  reviewSummary.value = {
    total: 0,
    averageRating: 0,
  }
  replyDraftMap.value = {}
  resetReviewForm()
}

const isDetailsVisible = computed({
  get: () => selectedPlugin.value !== null,
  set: (value: boolean) => {
    if (!value) {
      closeDetails()
    }
  }
})

const sortOptions: Array<{ label: string, value: SortBy }> = [
  { label: 'marketplace.sort.popular', value: 'popular' },
  { label: 'marketplace.sort.newest', value: 'newest' }
]

const getPluginKindLabel = (kind: PluginKind) => {
  if (kind === 'site-detector') {
    return t('marketplace.kindSiteDetector')
  }

  if (kind === 'editor-adapter') {
    return t('marketplace.kindEditorAdapter')
  }

  return t('marketplace.kindUploader')
}

const enabledFilterOptions = computed(() => [
  { label: t('marketplace.filters.enabledAll'), value: 'all' },
  { label: t('marketplace.filters.enabledOnly'), value: 'enabled' },
  { label: t('marketplace.filters.disabledOnly'), value: 'disabled' }
])

const installedFilterOptions = computed(() => [
  { label: t('marketplace.filters.installAll'), value: 'all' },
  { label: t('marketplace.filters.installedOnly'), value: 'installed' },
  { label: t('marketplace.filters.uninstalledOnly'), value: 'uninstalled' }
])

const kindFilterOptions = computed(() => {
  const availableKinds = new Set(plugins.value.map((plugin) => plugin.kind))

  return [
    { label: t('marketplace.filters.kindAll'), value: 'all' },
    ...pluginKindOrder
      .filter((kind) => availableKinds.has(kind))
      .map((kind) => ({
        label: getPluginKindLabel(kind),
        value: kind
      }))
  ]
})

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim().length > 0 ||
    sortBy.value !== 'popular' ||
    enabledFilter.value !== 'all' ||
    installedFilter.value !== 'all' ||
    kindFilter.value !== 'all'
  )
})

const resetFilters = () => {
  searchQuery.value = ''
  sortBy.value = 'popular'
  enabledFilter.value = 'all'
  installedFilter.value = 'all'
  kindFilter.value = 'all'
}

const filteredPlugins = computed(() => {
  const lowerQuery = searchQuery.value.trim().toLowerCase()
  const result = plugins.value.filter((plugin) => {
    const matchesSearch = !lowerQuery
      || plugin.name.toLowerCase().includes(lowerQuery)
      || plugin.description.toLowerCase().includes(lowerQuery)
    const matchesEnabled = enabledFilter.value === 'all'
      || (enabledFilter.value === 'enabled'
        ? plugin.installed && plugin.enabled
        : plugin.installed && !plugin.enabled)
    const matchesInstalled = installedFilter.value === 'all'
      || (installedFilter.value === 'installed' ? plugin.installed : !plugin.installed)
    const matchesKind = kindFilter.value === 'all' || plugin.kind === kindFilter.value

    return matchesSearch && matchesEnabled && matchesInstalled && matchesKind
  })

  result.sort((a, b) => {
    if (sortBy.value === 'popular') {
      return b.downloads - a.downloads
    }

    if (sortBy.value === 'newest') {
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    }

    return 0
  })

  return result
})

const userOptions = computed(() => {
  const options = [
    { label: 'Submit Plugin', key: 'submit' },
    { label: 'Logout', key: 'logout' }
  ]

  if (authStore.user?.role === 'ADMIN') {
    options.unshift({ label: 'Admin Review', key: 'admin' })
  }

  return options
})

const isCurrentUserAdmin = computed(() => authStore.user?.role === 'ADMIN')

const isCurrentUserPluginAuthor = computed(() => {
  if (!selectedPlugin.value || !authStore.user?.userId) {
    return false
  }

  return selectedPlugin.value.authorId === authStore.user.userId
})

const canCurrentUserReply = computed(() => {
  return isCurrentUserPluginAuthor.value || isCurrentUserAdmin.value
})

const hasCurrentUserReviewed = computed(() => {
  const currentUserId = authStore.user?.userId
  if (!currentUserId) {
    return false
  }

  return reviews.value.some((review) => review.reviewer.userId === currentUserId)
})

const handleUserSelect = (key: string) => {
  if (key === 'logout') {
    authStore.logout()
    message.success('Logged out')
    void router.push('/login')
  } else if (key === 'submit') {
    router.push('/plugins/submit')
  } else if (key === 'admin') {
    router.push('/admin')
  }
}

const login = () => {
  router.push({
    path: '/login',
    query: { next: '/plugins' },
  })
}
const fetchReviews = async (pluginId?: string) => {
  if (!pluginId) {
    return
  }

  reviewsLoading.value = true
  try {
    const res = await fetchPluginReviewsApi(pluginId)
    reviews.value = Array.isArray(res.data.reviews) ? res.data.reviews : []
    reviewSummary.value = {
      total: Number(res.data.summary?.total) || 0,
      averageRating: Number(res.data.summary?.averageRating) || 0,
    }

    const nextDraftMap: Record<string, string> = {}
    for (const review of reviews.value) {
      nextDraftMap[review.id] = ''
    }
    replyDraftMap.value = nextDraftMap
  } catch (error) {
    console.error('Failed to fetch reviews', error)
    message.error(t('marketplace.reviewLoadFailed'))
  } finally {
    reviewsLoading.value = false
  }
}

const openDetails = async (plugin: PluginMeta) => {
  selectedPlugin.value = plugin
  await fetchReviews(plugin.id)
}

const fetchPlugins = async () => {
  loading.value = true
  try {
    const res = await fetchPluginList()
    plugins.value = res.data.map((plugin: PluginEntity) => {
      const pluginContent = (plugin.versions?.[0]?.content || null) as Record<string, any> | null
      const pluginValidation = validatePluginContent(pluginContent)
      const rawKind = pluginContent?.kind === 'site-detector'
        ? 'site-detector'
        : pluginContent?.kind === 'editor-adapter'
          ? 'editor-adapter'
          : pluginContent?.kind === 'uploader'
            ? 'uploader'
            : null
      const pluginKind: PluginKind = pluginValidation.valid && pluginValidation.content
        ? pluginValidation.content.kind
        : (rawKind || 'uploader')
      const authorName = getPluginAuthorName(pluginContent?.author, plugin.author?.username || 'Unknown')

      return {
        id: plugin.id,
        kind: pluginKind,
        name: plugin.name,
        version: plugin.versions?.[0]?.version || '0.0.0',
        description: plugin.description,
        authorId: plugin.authorId,
        author: {
          username: authorName,
          avatar: plugin.author?.avatar || undefined
        },
        icon: (plugin as any).icon,
        downloads: Number(plugin.downloads) || 0,
        installed: false,
        enabled: false,
        content: pluginContent,
        updatedAt: plugin.updatedAt
      }
    })

    if (isExtensionInstalled.value) {
      window.postMessage({ type: 'GIOPIC_GET_INSTALLED_PLUGINS' }, '*')
    }
  } catch (error) {
    console.error('Failed to fetch plugins', error)
    message.error(t('marketplace.loadFailed'))
  } finally {
    loading.value = false
  }
}

const checkExtensionInstalled = () => {
  const installed = document.documentElement.hasAttribute('data-giopic-page-bundle')
  if (installed !== isExtensionInstalled.value) {
    isExtensionInstalled.value = installed
    if (installed) {
      window.postMessage({ type: 'GIOPIC_GET_INSTALLED_PLUGINS' }, '*')
    }
  }
}

const handleInstall = (plugin: PluginMeta) => {
  if (!isExtensionInstalled.value) {
    message.warning(t('marketplace.extensionNotInstalled'))
    return
  }

  const validation = validatePluginContent(plugin.content)
  if (!validation.valid || !validation.content) {
    message.error(t('marketplace.invalidPayload'))
    return
  }

  recordPluginDownload(plugin.id).catch((err) => {
    console.debug('Download record failed:', err)
  })

  window.postMessage({
    type: 'GIOPIC_INSTALL_PLUGIN',
    plugin: validation.content
  }, '*')
}

const handleUninstall = (id: string) => {
  if (!isExtensionInstalled.value) return
  window.postMessage({
    type: 'GIOPIC_UNINSTALL_PLUGIN',
    pluginId: id
  }, '*')
}

const handleToggle = (id: string, enabled: boolean) => {
  if (!isExtensionInstalled.value) return
  window.postMessage({
    type: 'GIOPIC_TOGGLE_PLUGIN',
    pluginId: id,
    enabled
  }, '*')
}

const submitReview = async () => {
  const plugin = selectedPlugin.value
  if (!plugin) {
    return
  }

  if (!authStore.user) {
    message.warning(t('marketplace.reviewLoginRequired'))
    return
  }

  if (hasCurrentUserReviewed.value) {
    message.warning(t('marketplace.reviewDuplicateForbidden'))
    return
  }

  if (!reviewForm.value.content.trim()) {
    message.warning(t('marketplace.reviewContentRequired'))
    return
  }

  reviewSubmitting.value = true
  try {
    await createPluginReview(plugin.id, {
      rating: reviewForm.value.rating,
      content: reviewForm.value.content,
    })
    message.success(t('marketplace.reviewSubmitted'))
    await fetchReviews(plugin.id)
  } catch (error) {
    console.error('Failed to submit review', error)

    const responseMessage = (error as any)?.response?.data?.message
    const normalizedMessage = Array.isArray(responseMessage)
      ? responseMessage.join(' ')
      : typeof responseMessage === 'string'
        ? responseMessage
        : ''

    if (normalizedMessage.includes('already reviewed')) {
      message.warning(t('marketplace.reviewDuplicateForbidden'))
    } else {
      message.error(t('marketplace.reviewSubmitFailed'))
    }
  } finally {
    reviewSubmitting.value = false
  }
}

const submitReply = async (reviewId: string) => {
  const plugin = selectedPlugin.value
  if (!plugin) {
    return
  }

  if (!canCurrentUserReply.value) {
    message.warning(t('marketplace.replyAuthorOnly'))
    return
  }

  const content = (replyDraftMap.value[reviewId] || '').trim()
  if (!content) {
    message.warning(t('marketplace.replyContentRequired'))
    return
  }

  replySubmittingId.value = reviewId
  try {
    await upsertPluginReviewReply(plugin.id, reviewId, {
      content,
    })
    message.success(t('marketplace.replySubmitted'))
    await fetchReviews(plugin.id)
  } catch (error) {
    console.error('Failed to submit reply', error)
    message.error(t('marketplace.replySubmitFailed'))
  } finally {
    replySubmittingId.value = null
  }
}

const deleteReview = async (reviewId: string) => {
  const plugin = selectedPlugin.value
  if (!plugin) {
    return
  }

  if (!isCurrentUserAdmin.value) {
    message.warning(t('marketplace.reviewDeleteAdminOnly'))
    return
  }

  const confirmed = window.confirm(t('marketplace.confirmDeleteReview'))
  if (!confirmed) {
    return
  }

  deletingReviewId.value = reviewId
  try {
    await deletePluginReview(plugin.id, reviewId)
    message.success(t('marketplace.reviewDeleted'))
    await fetchReviews(plugin.id)
  } catch (error) {
    console.error('Failed to delete review', error)
    message.error(t('marketplace.reviewDeleteFailed'))
  } finally {
    deletingReviewId.value = null
  }
}

const handleMessage = (event: MessageEvent) => {
  const data = event.data
  if (!data || typeof data !== 'object') return

  switch (data.type) {
    case 'GIOPIC_INSTALL_PLUGIN_RESULT':
      if (data.success) {
        message.success(t('marketplace.installSuccess'))
        window.postMessage({ type: 'GIOPIC_GET_INSTALLED_PLUGINS' }, '*')
      } else {
        message.error(t('marketplace.installFailed') + (data.error || 'Unknown error'))
      }
      break

    case 'GIOPIC_UNINSTALL_PLUGIN_RESULT':
      if (data.success) {
        message.success(t('marketplace.uninstallSuccess'))
        window.postMessage({ type: 'GIOPIC_GET_INSTALLED_PLUGINS' }, '*')
      } else {
        message.error(t('marketplace.uninstallFailed') + (data.error || 'Unknown error'))
      }
      break

    case 'GIOPIC_TOGGLE_PLUGIN_RESULT':
      if (data.success) {
        window.postMessage({ type: 'GIOPIC_GET_INSTALLED_PLUGINS' }, '*')
      } else {
        message.error(t('marketplace.toggleFailed') + (data.error || 'Unknown error'))
      }
      break

    case 'GIOPIC_GET_INSTALLED_PLUGINS_RESULT':
      if (Array.isArray(data.plugins)) {
        const installedIds = new Set(data.plugins.filter((plugin: any) => plugin && plugin.id).map((plugin: any) => plugin.id))
        const enabledMap = new Map<string, boolean>(data.plugins.filter((plugin: any) => plugin && plugin.id).map((plugin: any) => [plugin.id, Boolean(plugin.enabled)]))

        plugins.value.forEach((plugin) => {
          plugin.installed = installedIds.has(plugin.id)
          plugin.enabled = enabledMap.get(plugin.id) || false
        })
      }
      break

    case 'GIOPIC_PLUGINS_UPDATED':
      window.postMessage({ type: 'GIOPIC_GET_INSTALLED_PLUGINS' }, '*')
      break
  }
}

const timer = ref<number | null>(null)

onMounted(() => {
  if (!authStore.user && authStore.token) {
    authStore.fetchUser()
  }

  fetchPlugins()
  checkExtensionInstalled()
  timer.value = window.setInterval(checkExtensionInstalled, 1000)
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
  window.removeEventListener('message', handleMessage)
})
</script>

<template>
  <div class="pt-25 pb-20 container-custom min-h-screen">
    <div class="absolute top-4 right-4 z-50">
      <div v-if="authStore.user" class="flex items-center gap-2">
        <NDropdown :options="userOptions" @select="handleUserSelect">
          <div
            class="flex items-center gap-2 cursor-pointer bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition">
            <NAvatar round size="small" :src="authStore.user.avatar || undefined" />
            <span class="font-bold">{{ authStore.user.username }}</span>
          </div>
        </NDropdown>
      </div>
      <div v-else>
        <NButton type="primary" round @click="login">
          <template #icon>
            <div class="i-ph-github-logo" />
          </template>
          Login with GitHub
        </NButton>
      </div>
    </div>

    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0">
      <div v-if="!isExtensionInstalled" class="fixed top-80px left-0 w-full z-40 px-4 pointer-events-none">
        <div class="max-w-800px mx-auto pointer-events-auto">
          <NAlert type="warning" show-icon closable>
            <template #icon>
              <div class="i-ph-warning-circle-fill text-1.5rem" />
            </template>
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span class="font-800 text-1rem block md:inline">{{ t('marketplace.extensionNotInstalled') }}</span>
                <p class="mt-1 text-0.9rem opacity-90">{{ t('marketplace.installExtensionTip') }}</p>
              </div>
              <NButton type="warning" ghost round tag="a" href="https://github.com/ZenEcho/GioPic_Web_Extension"
                target="_blank">
                <template #icon>
                  <div class="i-ph-download-simple-bold" />
                </template>
                {{ t('marketplace.downloadLink') }}
              </NButton>
            </div>
          </NAlert>
        </div>
      </div>
    </Transition>

    <div class="text-center mb-12">
      <h1 class="text-3rem font-800 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
        {{ t('header.marketplace') }}
      </h1>
      <p class="text-text-secondary text-1.1rem max-w-600px mx-auto mb-6">
        {{ t('marketplace.subtitle') }}
      </p>

      <a href="https://github.com/ZenEcho/GioPic_Web_Extension/blob/main/plugins/plugin_dev_guide.md" target="_blank"
        class="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors decoration-none font-600">
        <div class="i-ph-code" />
        {{ t('marketplace.devGuide') }}
      </a>
    </div>

    <div class="flex flex-col md:flex-row gap-4 mb-10 justify-between items-center">
      <div class="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
        <NButton v-for="opt in sortOptions" :key="opt.value" :type="sortBy === opt.value ? 'primary' : 'default'"
          secondary round @click="sortBy = opt.value">
          {{ t(opt.label) }}
        </NButton>
      </div>
      <div class="w-full md:w-300px">
        <NInput v-model:value="searchQuery" :placeholder="t('marketplace.searchPlaceholder')" round clearable>
          <template #prefix>
            <div class="i-ph-magnifying-glass text-text-secondary" />
          </template>
        </NInput>
      </div>
    </div>

    <div class="mb-10 rounded-2xl border border-border bg-white/70 p-4 backdrop-blur-sm">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4 items-end">
        <label class="block">
          <span class="mb-2 block text-0.8rem font-600 text-text-tertiary">
            {{ t('marketplace.filters.kindLabel') }}
          </span>
          <NSelect v-model:value="kindFilter" :options="kindFilterOptions" />
        </label>

        <label class="block">
          <span class="mb-2 block text-0.8rem font-600 text-text-tertiary">
            {{ t('marketplace.filters.installLabel') }}
          </span>
          <NSelect v-model:value="installedFilter" :options="installedFilterOptions" />
        </label>

        <label class="block">
          <span class="mb-2 block text-0.8rem font-600 text-text-tertiary">
            {{ t('marketplace.filters.enabledLabel') }}
          </span>
          <NSelect v-model:value="enabledFilter" :options="enabledFilterOptions" />
        </label>

        <NButton block secondary round :disabled="!hasActiveFilters" @click="resetFilters">
          {{ t('marketplace.filters.reset') }}
        </NButton>
      </div>

      <div class="mt-3 text-0.85rem text-text-tertiary">
        {{ t('marketplace.filters.resultCount', { count: filteredPlugins.length, total: plugins.length }) }}
      </div>
    </div>

    <MarketplaceGridSection
      :loading="loading"
      :filtered-plugins="filteredPlugins"
      :on-open-details="openDetails"
      :on-install="handleInstall"
      :on-toggle="handleToggle"
      :on-uninstall="handleUninstall"
    />

    <PluginDetailsModal
      v-model:show="isDetailsVisible"
      :selected-plugin="selectedPlugin"
      :review-summary="reviewSummary"
      :auth-user="authStore.user"
      :has-current-user-reviewed="hasCurrentUserReviewed"
      :review-form="reviewForm"
      :review-submitting="reviewSubmitting"
      :reviews-loading="reviewsLoading"
      :reviews="reviews"
      :can-current-user-reply="canCurrentUserReply"
      :is-current-user-admin="isCurrentUserAdmin"
      :reply-draft-map="replyDraftMap"
      :reply-submitting-id="replySubmittingId"
      :deleting-review-id="deletingReviewId"
      :format-date-time="formatDateTime"
      :on-login="login"
      :on-submit-review="submitReview"
      :on-submit-reply="submitReply"
      :on-delete-review="deleteReview"
    />
  </div>
</template>

