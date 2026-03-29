<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NCard,
  NButton,
  NTag,
  useMessage,
  NGrid,
  NGridItem,
  NPopconfirm,
  NModal,
  NDivider,
  NInput,
  NEmpty,
} from 'naive-ui'
import { useAuthStore } from '@common/stores/auth'
import {
  deletePluginVersion as deletePluginVersionApi,
  fetchMyPlugins as fetchMyPluginsApi,
  fetchPluginVersions as fetchPluginVersionsApi,
  rollbackPluginVersion as rollbackPluginVersionApi,
  updatePluginVisibility,
} from '@common/api'
import { useDateFormat, usePluginStatus } from '@common/composables'
import type { PluginListItem, PluginVersion } from '@common/types'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const { t } = useI18n()
const { formatDateTime } = useDateFormat()
const { getPluginStatusType } = usePluginStatus()

const myPlugins = ref<PluginListItem[]>([])
const loading = ref(false)

const versionManagerVisible = ref(false)
const versionManagerLoading = ref(false)
const selectedPlugin = ref<PluginListItem | null>(null)
const versionList = ref<PluginVersion[]>([])
const activeVersion = ref<string | null>(null)
const versionActionReason = ref('')
const actionLoadingKey = ref<string | null>(null)

onMounted(async () => {
  if (!authStore.token) {
    message.warning(t('submit.loginFirst'))
    router.push('/plugins')
    return
  }
  await fetchMyPlugins()
})

const fetchMyPlugins = async () => {
  loading.value = true
  try {
    const res = await fetchMyPluginsApi()
    myPlugins.value = Array.isArray(res.data) ? res.data : []
  } catch {
    message.error(t('dashboard.loadFailed'))
  } finally {
    loading.value = false
  }
}

const fetchPluginVersions = async (pluginId: string) => {
  versionManagerLoading.value = true
  try {
    const res = await fetchPluginVersionsApi(pluginId)
    versionList.value = Array.isArray(res.data?.versions) ? res.data.versions : []
    activeVersion.value = res.data?.activeVersion || null
  } catch {
    message.error(t('dashboard.versionManager.fetchFailed'))
    versionList.value = []
    activeVersion.value = null
  } finally {
    versionManagerLoading.value = false
  }
}

const getStatusType = (status?: string) => getPluginStatusType(status)

const getStatusText = (status?: string) => {
  if (!status) {
    return '-'
  }
  return t(`dashboard.status.${status}`) || status
}

const editPlugin = (pluginId: string) => {
  router.push(`/plugins/submit?edit=${pluginId}`)
}

const isReviewRejectedLike = (status?: string) => {
  return status === 'REJECTED' || status === 'CHANGES_REQUIRED'
}

const toggleVisibility = async (plugin: PluginListItem) => {
  try {
    const newStatus = !plugin.isPublic
    await updatePluginVisibility(plugin.id, {
      isPublic: newStatus,
    })
    plugin.isPublic = newStatus
    message.success(newStatus ? t('dashboard.published') : t('dashboard.unpublished'))
  } catch (error) {
    const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code
    if (code === 'PLUGIN_VISIBILITY_ADMIN_DISABLED') {
      const reason = plugin.adminDisableReason?.trim()
      if (reason) {
        message.warning(t('dashboard.adminDisabledWithReason', { reason }))
      } else {
        message.warning(t('dashboard.adminDisabled'))
      }
      return
    }
    message.error(t('dashboard.opFailed'))
  }
}

const openVersionManager = async (plugin: PluginListItem) => {
  selectedPlugin.value = plugin
  versionActionReason.value = ''
  versionManagerVisible.value = true
  await fetchPluginVersions(plugin.id)
}

const closeVersionManager = () => {
  versionManagerVisible.value = false
  selectedPlugin.value = null
  versionList.value = []
  activeVersion.value = null
  versionActionReason.value = ''
  actionLoadingKey.value = null
}

const getActionKey = (action: 'rollback' | 'delete', version: string) => `${action}:${version}`

const isActionLoading = (action: 'rollback' | 'delete', version: string) => {
  return actionLoadingKey.value === getActionKey(action, version)
}

const canRollback = (item: PluginVersion) => {
  return item.status === 'APPROVED' && !item.isActive
}

const canDeleteVersion = (item: PluginVersion) => {
  return !item.isActive
}

const getLatestRejectedReason = (plugin: PluginListItem) => {
  const latest = plugin.versions[0]
  if (!latest || !isReviewRejectedLike(latest.status)) {
    return ''
  }
  const reason = latest.auditLog?.trim()
  return reason || t('dashboard.versionManager.noRejectReason')
}

const getRejectReason = (item: PluginVersion) => {
  const reason = item.auditLog?.trim()
  return reason || t('dashboard.versionManager.noRejectReason')
}

const showVersionError = (error: unknown, fallbackKey: string) => {
  const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code
  if (code === 'PLUGIN_VERSION_DELETE_ACTIVE_FORBIDDEN') {
    message.warning(t('dashboard.versionManager.deleteActiveForbidden'))
    return
  }
  if (code === 'PLUGIN_VERSION_DELETE_LAST_APPROVED_FORBIDDEN') {
    message.warning(t('dashboard.versionManager.keepOneApprovedRequired'))
    return
  }
  if (code === 'PLUGIN_VERSION_ALREADY_ACTIVE') {
    message.warning(t('dashboard.versionManager.alreadyActive'))
    return
  }
  message.error(t(fallbackKey))
}

const rollbackVersion = async (item: PluginVersion) => {
  const plugin = selectedPlugin.value
  if (!plugin) {
    return
  }

  if (!canRollback(item)) {
    return
  }

  const confirmed = window.confirm(t('dashboard.versionManager.confirmRollback', { version: item.version }))
  if (!confirmed) {
    return
  }

  actionLoadingKey.value = getActionKey('rollback', item.version)
  try {
    await rollbackPluginVersionApi(plugin.id, item.version, versionActionReason.value || undefined)
    message.success(t('dashboard.versionManager.rollbackSuccess', { version: item.version }))
    await Promise.all([
      fetchPluginVersions(plugin.id),
      fetchMyPlugins(),
    ])
  } catch (error) {
    showVersionError(error, 'dashboard.versionManager.rollbackFailed')
  } finally {
    actionLoadingKey.value = null
  }
}

const deleteVersion = async (item: PluginVersion) => {
  const plugin = selectedPlugin.value
  if (!plugin) {
    return
  }

  if (!canDeleteVersion(item)) {
    message.warning(t('dashboard.versionManager.deleteActiveForbidden'))
    return
  }

  const confirmed = window.confirm(t('dashboard.versionManager.confirmDeleteVersion', { version: item.version }))
  if (!confirmed) {
    return
  }

  actionLoadingKey.value = getActionKey('delete', item.version)
  try {
    await deletePluginVersionApi(plugin.id, item.version, versionActionReason.value || undefined)
    message.success(t('dashboard.versionManager.deleteSuccess', { version: item.version }))
    await Promise.all([
      fetchPluginVersions(plugin.id),
      fetchMyPlugins(),
    ])
  } catch (error) {
    showVersionError(error, 'dashboard.versionManager.deleteFailed')
  } finally {
    actionLoadingKey.value = null
  }
}
</script>
<template>
  <div class="pt-25 pb-20 container-custom min-h-screen">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2rem font-800 mb-2">{{ t('dashboard.title') }}</h1>
        <p class="text-text-secondary">{{ t('dashboard.subtitle') }}</p>
      </div>
      <NButton type="primary" size="large" @click="router.push('/plugins/submit')">
        <template #icon><div class="i-ph-plus-bold" /></template>
        {{ t('dashboard.submitNew') }}
      </NButton>
    </div>

    <div v-if="loading" class="text-center py-20">
      <div class="animate-spin text-4xl text-primary">⌛</div>
    </div>

    <div v-else-if="myPlugins.length === 0" class="text-center py-20 bg-gray-50/50 rounded-xl border border-dashed border-gray-300">
      <div class="i-ph-package text-4rem text-gray-300 mb-4 mx-auto" />
      <h3 class="text-xl font-600 text-gray-500 mb-2">{{ t('dashboard.noPlugins') }}</h3>
      <p class="text-gray-400 mb-6">{{ t('dashboard.noPluginsDesc') }}</p>
      <NButton type="primary" @click="router.push('/plugins/submit')">
        {{ t('dashboard.getStarted') }}
      </NButton>
    </div>

    <NGrid v-else x-gap="24" y-gap="24" cols="1 s:2 m:3" responsive="screen">
      <NGridItem v-for="plugin in myPlugins" :key="plugin.id">
        <NCard hoverable class="h-full border-border rounded-xl">
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
              <img v-if="plugin.icon?.startsWith('http')" :src="plugin.icon" class="w-full h-full object-cover" />
              <div v-else :class="[plugin.icon || 'i-ph-puzzle-piece', 'text-2rem']" />
            </div>
            <div class="flex gap-2">
               <NTag :type="plugin.isPublic ? 'success' : 'warning'" size="small" round>
                {{ plugin.isPublic ? t('dashboard.public') : t('dashboard.private') }}
              </NTag>
              <NTag :type="getStatusType(plugin.versions[0]?.status)" size="small" round>
                {{ getStatusText(plugin.versions[0]?.status) }}
              </NTag>
            </div>
          </div>

          <h3 class="text-1.1rem font-700 text-text-main mb-1 truncate">{{ plugin.name }}</h3>
          <p class="text-0.8rem text-text-tertiary">ID: {{ plugin.id }}</p>
          <p v-if="isReviewRejectedLike(plugin.versions[0]?.status)" class="text-0.8rem text-red-500 mt-1 mb-2 line-clamp-2">
            {{ t('dashboard.versionManager.reviewReasonLabel') }}: {{ getLatestRejectedReason(plugin) }}
          </p>
          <p
            v-if="plugin.adminDisabled && plugin.adminDisableReason"
            class="text-0.8rem text-amber-600 mt-1 mb-4 line-clamp-2"
          >
            {{ t('dashboard.adminDisabledReasonLabel') }}: {{ plugin.adminDisableReason }}
          </p>
          <div v-else class="mb-4" />

          <div class="flex gap-2 mt-4">
            <NButton size="small" class="flex-1" @click="editPlugin(plugin.id)">
              <template #icon><div class="i-ph-pencil-simple" /></template>
              {{ t('dashboard.edit') }}
            </NButton>

            <NButton size="small" secondary @click="openVersionManager(plugin)">
              <template #icon><div class="i-ph-clock-counter-clockwise" /></template>
              {{ t('dashboard.versionManager.manage') }}
            </NButton>

            <NPopconfirm @positive-click="toggleVisibility(plugin)">
              <template #trigger>
                <NButton size="small" :type="plugin.isPublic ? 'warning' : 'success'" secondary>
                  <template #icon>
                    <div :class="plugin.isPublic ? 'i-ph-eye-slash' : 'i-ph-eye'" />
                  </template>
                </NButton>
              </template>
              {{ plugin.isPublic ? t('dashboard.confirmUnpublish') : t('dashboard.confirmPublish') }}
            </NPopconfirm>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <NModal v-model:show="versionManagerVisible">
      <NCard
        class="max-h-[85vh] overflow-auto"
        style="width: min(900px, calc(100vw - 32px));"
        :title="selectedPlugin ? `${selectedPlugin.name} · ${t('dashboard.versionManager.title')}` : t('dashboard.versionManager.title')"
        closable
        @close="closeVersionManager"
      >
        <div class="flex flex-col gap-3">
          <div class="text-0.9rem text-text-secondary">
            {{ t('dashboard.versionManager.activeVersionLabel') }}:
            <span class="font-700 text-text-main">{{ activeVersion || '-' }}</span>
          </div>
          <NInput
            v-model:value="versionActionReason"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            :maxlength="300"
            :placeholder="t('dashboard.versionManager.reasonPlaceholder')"
            show-count
          />
        </div>

        <NDivider />

        <div v-if="versionManagerLoading" class="text-center py-8 text-text-secondary">
          {{ t('dashboard.versionManager.loading') }}
        </div>

        <NEmpty v-else-if="versionList.length === 0" :description="t('dashboard.versionManager.noVersions')" />

        <div v-else class="flex flex-col gap-3">
          <div v-for="item in versionList" :key="item.id" class="rounded-xl border border-border bg-white/60 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-1rem font-700">v{{ item.version }}</span>
                <NTag :type="getStatusType(item.status)" size="small" round>
                  {{ getStatusText(item.status) }}
                </NTag>
                <NTag v-if="item.isActive" type="success" size="small" round>
                  {{ t('dashboard.versionManager.active') }}
                </NTag>
              </div>
              <span class="text-0.8rem text-text-tertiary">
                {{ formatDateTime(item.createdAt) }}
              </span>
            </div>

            <p class="text-0.9rem text-text-secondary mt-2 whitespace-pre-wrap">
              {{ item.changelog || t('dashboard.versionManager.noChangelog') }}
            </p>
            <p v-if="isReviewRejectedLike(item.status)" class="text-0.85rem text-red-500 mt-2 whitespace-pre-wrap">
              {{ t('dashboard.versionManager.reviewReasonLabel') }}: {{ getRejectReason(item) }}
            </p>

            <div class="flex flex-wrap items-center gap-2 mt-3">
              <NButton
                size="small"
                type="warning"
                secondary
                :disabled="!canRollback(item)"
                :loading="isActionLoading('rollback', item.version)"
                @click="rollbackVersion(item)"
              >
                {{ t('dashboard.versionManager.rollback') }}
              </NButton>

              <NButton
                size="small"
                type="error"
                secondary
                :disabled="!canDeleteVersion(item)"
                :loading="isActionLoading('delete', item.version)"
                @click="deleteVersion(item)"
              >
                {{ t('dashboard.versionManager.deleteVersion') }}
              </NButton>

              <span v-if="item.isActive" class="text-0.8rem text-text-tertiary">
                {{ t('dashboard.versionManager.deleteActiveForbidden') }}
              </span>
            </div>
          </div>
        </div>
      </NCard>
    </NModal>
  </div>
</template>







