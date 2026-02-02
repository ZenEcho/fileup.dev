
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  NCard, NButton, NTag, useMessage, NGrid, NGridItem, NPopconfirm
} from 'naive-ui'
import { useAuthStore } from '../stores/auth'
import api from '../api'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const { t } = useI18n()

const myPlugins = ref<any[]>([])
const loading = ref(false)

onMounted(async () => {
  if (!authStore.token) {
    message.warning(t('submit.loginFirst'))
    router.push('/plugins')
    return
  }
  fetchMyPlugins()
})

const fetchMyPlugins = async () => {
  loading.value = true
  try {
    const res = await api.get('/plugins/my')
    myPlugins.value = res.data
  } catch (error) {
    message.error(t('dashboard.loadFailed'))
  } finally {
    loading.value = false
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'success'
    case 'REJECTED': return 'error'
    case 'PENDING': return 'warning'
    default: return 'default'
  }
}

const getStatusText = (status: string) => {
  return t(`dashboard.status.${status}`) || status
}

const editPlugin = (pluginId: string) => {
  router.push(`/plugins/submit?edit=${pluginId}`)
}

const toggleVisibility = async (plugin: any) => {
  try {
    const newStatus = !plugin.isPublic
    await api.patch(`/plugins/${plugin.id}/visibility`, {
      isPublic: newStatus
    })
    plugin.isPublic = newStatus
    message.success(newStatus ? t('dashboard.published') : t('dashboard.unpublished'))
  } catch (error) {
    message.error(t('dashboard.opFailed'))
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
          <p class="text-0.8rem text-text-tertiary mb-4">ID: {{ plugin.id }}</p>
          
          <div class="flex gap-2 mt-4">
            <NButton size="small" class="flex-1" @click="editPlugin(plugin.id)">
              <template #icon><div class="i-ph-pencil-simple" /></template>
              {{ t('dashboard.edit') }}
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
  </div>
</template>
