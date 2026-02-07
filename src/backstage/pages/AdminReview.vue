
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  NCard, NButton, NTag, useMessage, NCode, NSpace, NTabs, NTabPane, NPopconfirm, NGrid, NGridItem
} from 'naive-ui'
import { useAuthStore } from '@common/stores/auth'
import api from '@common/services/api'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const { t } = useI18n()

const pendingPlugins = ref<any[]>([])
const allPlugins = ref<any[]>([])
const loading = ref(false)
const loadingAll = ref(false)

onMounted(async () => {
  // Ensure user data is fresh
  if (!authStore.user) {
    await authStore.fetchUser()
  }
  
  if (authStore.user?.role !== 'ADMIN') {
    message.error(t('admin.unauthorized'))
    router.push('/plugins')
    return
  }
  fetchPendingPlugins()
  fetchAllPlugins()
})

const fetchPendingPlugins = async () => {
  loading.value = true
  try {
    const res = await api.get('/plugins/pending')
    pendingPlugins.value = res.data
  } catch (error) {
    message.error(t('admin.loadingFailed'))
  } finally {
    loading.value = false
  }
}

const fetchAllPlugins = async () => {
  loadingAll.value = true
  try {
    const res = await api.get('/plugins/admin/all')
    allPlugins.value = res.data
  } catch (error) {
    message.error(t('admin.loadingFailed'))
  } finally {
    loadingAll.value = false
  }
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

const deletePlugin = async (plugin: any) => {
  try {
    await api.delete(`/plugins/${plugin.id}`)
    message.success(t('dashboard.deleted'))
    fetchAllPlugins()
    fetchPendingPlugins()
  } catch (error) {
    message.error(t('dashboard.opFailed'))
  }
}

const audit = async (plugin: any, status: 'APPROVED' | 'REJECTED') => {
  try {
    const version = plugin.versions[0].version
    await api.patch(`/plugins/${plugin.id}/versions/${version}/audit`, {
      status
    })
    message.success(t('admin.auditSuccess', { status: status.toLowerCase() }))
    fetchPendingPlugins()
    fetchAllPlugins()
  } catch (error) {
    message.error(t('admin.auditFailed'))
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
</script>

<template>
  <div class="pt-25 pb-20 container-custom min-h-screen">
    <h1 class="text-2xl font-bold mb-6">{{ t('admin.title') }}</h1>
    
    <NTabs type="line" animated>
      <NTabPane name="pending" :tab="t('admin.pendingTag')">
        <div v-if="loading" class="text-center">{{ t('admin.loading') }}</div>
        
        <div v-else-if="pendingPlugins.length === 0" class="text-center text-gray-500">
          {{ t('admin.noPending') }}
        </div>
        
        <div v-else class="grid gap-6">
          <NCard v-for="plugin in pendingPlugins" :key="plugin.id" :title="plugin.name">
            <template #header-extra>
              <NTag type="warning">{{ t('admin.pendingTag') }}</NTag>
            </template>
            
            <div class="mb-4">
              <p><strong>{{ t('admin.id') }}:</strong> {{ plugin.id }}</p>
              <p><strong>{{ t('admin.version') }}:</strong> {{ plugin.versions[0].version }}</p>
              <p><strong>{{ t('admin.author') }}:</strong> {{ plugin.author.username }}</p>
              <p><strong>{{ t('admin.desc') }}:</strong> {{ plugin.description }}</p>
            </div>
            
            <NCard size="small" :title="t('admin.codePreview')" class="mb-4 bg-gray-50">
               <NCode :code="JSON.stringify(plugin.versions[0].content, null, 2)" language="json" word-wrap />
            </NCard>
            
            <template #action>
              <NSpace justify="end">
                <NButton type="error" @click="audit(plugin, 'REJECTED')">{{ t('admin.reject') }}</NButton>
                <NButton type="success" @click="audit(plugin, 'APPROVED')">{{ t('admin.approve') }}</NButton>
              </NSpace>
            </template>
          </NCard>
        </div>
      </NTabPane>
      
      <NTabPane name="all" :tab="t('marketplace.categories.all')">
        <div v-if="loadingAll" class="text-center">{{ t('admin.loading') }}</div>
        
        <NGrid v-else x-gap="24" y-gap="24" cols="1 s:2 m:3" responsive="screen">
          <NGridItem v-for="plugin in allPlugins" :key="plugin.id">
            <NCard hoverable class="h-full border-border rounded-xl">
              <div class="flex items-start justify-between mb-4">
                <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                  <img v-if="plugin.icon?.startsWith('http')" :src="plugin.icon" class="w-full h-full object-cover" />
                  <div v-else :class="[plugin.icon || 'i-ph-puzzle-piece', 'text-2rem']" />
                </div>
                <div class="flex flex-col gap-1 items-end">
                   <NTag :type="plugin.isPublic ? 'success' : 'warning'" size="small" round>
                    {{ plugin.isPublic ? 'Public' : 'Private' }}
                  </NTag>
                  <NTag v-if="plugin.versions[0]" :type="getStatusType(plugin.versions[0].status)" size="small" round>
                    v{{ plugin.versions[0].version }} ({{ getStatusText(plugin.versions[0].status) }})
                  </NTag>
                </div>
              </div>
              
              <h3 class="text-1.1rem font-700 text-text-main mb-1 truncate">{{ plugin.name }}</h3>
              <p class="text-0.8rem text-text-tertiary mb-1">ID: {{ plugin.id }}</p>
              <p class="text-0.8rem text-text-tertiary mb-4">Author: {{ plugin.author.username }}</p>
              
              <div class="flex gap-2 mt-4">
                <div class="flex-1">
                  <NPopconfirm @positive-click="toggleVisibility(plugin)">
                    <template #trigger>
                      <NButton size="small" block :type="plugin.isPublic ? 'warning' : 'success'" secondary>
                        <template #icon>
                          <div :class="plugin.isPublic ? 'i-ph-eye-slash' : 'i-ph-eye'" />
                        </template>
                        {{ plugin.isPublic ? t('dashboard.unpublish') : t('dashboard.publish') }}
                      </NButton>
                    </template>
                    {{ plugin.isPublic ? t('dashboard.confirmUnpublish') : t('dashboard.confirmPublish') }}
                  </NPopconfirm>
                </div>

                <div class="flex-1">
                  <NPopconfirm @positive-click="deletePlugin(plugin)">
                    <template #trigger>
                      <NButton size="small" block type="error" secondary>
                        <template #icon>
                          <div class="i-ph-trash" />
                        </template>
                        {{ t('dashboard.delete') }}
                      </NButton>
                    </template>
                    {{ t('dashboard.confirmDelete') }}
                  </NPopconfirm>
                </div>
              </div>
            </NCard>
          </NGridItem>
        </NGrid>
      </NTabPane>
    </NTabs>
  </div>
</template>
