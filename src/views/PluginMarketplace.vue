
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { 
  NInput, NButton, NGrid, NGridItem, NCard, NTag, useMessage, NAlert, NAvatar, NDropdown
} from 'naive-ui'
import { useAuthStore } from '../stores/auth'
import api, { API_BASE_URL } from '../api'

const { t } = useI18n()
const message = useMessage()
const router = useRouter()
const authStore = useAuthStore()

// Plugin Interface
interface PluginMeta {
  id: string
  name: string
  version: string
  description: string
  author: {
    username: string
    avatar?: string
  }
  icon: string
  downloads: number
  installed: boolean
  enabled: boolean
  content?: any
  versions?: any[]
  updatedAt?: string
}

const plugins = ref<PluginMeta[]>([])
const loading = ref(false)

const searchQuery = ref('')
const sortBy = ref('popular')
const isExtensionInstalled = ref(false)

const sortOptions = [
  { label: 'marketplace.sort.popular', value: 'popular' },
  { label: 'marketplace.sort.newest', value: 'newest' }
]

const filteredPlugins = computed(() => {
  let result = plugins.value.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          plugin.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesSearch
  })

  result.sort((a, b) => {
    if (sortBy.value === 'popular') {
      return b.downloads - a.downloads
    } else if (sortBy.value === 'newest') {
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    }
    return 0
  })

  return result
})

const userOptions = computed(() => [
  { label: 'Submit Plugin', key: 'submit' },
  { label: 'Logout', key: 'logout' }
])

if (authStore.user?.role === 'ADMIN') {
  userOptions.value.unshift({ label: 'Admin Review', key: 'admin' })
}

const handleUserSelect = (key: string) => {
  if (key === 'logout') {
    authStore.logout()
    message.success('Logged out')
  } else if (key === 'submit') {
    router.push('/plugins/submit')
  } else if (key === 'admin') {
    router.push('/admin/review')
  }
}

const login = () => {
  window.location.href = `${API_BASE_URL}/auth/github`
}

const fetchPlugins = async () => {
  loading.value = true
  try {
    const res = await api.get('/plugins')
    // Transform backend data to match frontend interface
    plugins.value = res.data.map((p: any) => {
      const content = p.versions?.[0]?.content
      const contentAuthor = content?.author
      const authorName = typeof contentAuthor === 'string' 
        ? contentAuthor 
        : (contentAuthor?.username || p.author.username)

      return {
        id: p.id,
        name: p.name,
        version: p.versions?.[0]?.version || '0.0.0',
        description: p.description,
        author: {
          username: authorName,
          avatar: p.author.avatar // Keep uploader's avatar as fallback/default
        },
        icon: p.icon,
        downloads: Number(p.downloads) || 0,
        installed: false,
        enabled: false,
        content: content,
        updatedAt: p.updatedAt
      }
    })
    
    // If extension is installed, sync status
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
 
   // Construct the payload expected by the extension
  // Ensure payload is JSON-serializable (removes any Vue proxies or non-clonable objects)
  const content = plugin.content ? JSON.parse(JSON.stringify(plugin.content)) : {}
  const payload = JSON.parse(JSON.stringify({
    id: plugin.id,
    name: plugin.name,
    version: plugin.version,
    description: plugin.description,
    icon: plugin.icon,
    ...content // Spread the JSON content (script, inputs, etc.)
  }))

  // Record download
  api.post(`/plugins/${plugin.id}/download`).catch(err => {
    // Ignore errors (e.g. already downloaded from this IP)
    console.debug('Download record failed:', err)
  })

  window.postMessage({
    type: 'GIOPIC_INSTALL_PLUGIN',
    plugin: payload
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
     enabled: enabled
   }, '*')
 }
 
 const handleMessage = (event: MessageEvent) => {
   const data = event.data
   if (!data || typeof data !== 'object') return
 
   switch (data.type) {
     case 'GIOPIC_INSTALL_PLUGIN_RESULT':
       if (data.success) {
         message?.success(t('marketplace.installSuccess') || 'Plugin installed successfully!')
         window.postMessage({ type: 'GIOPIC_GET_INSTALLED_PLUGINS' }, '*')
       } else {
         message?.error((t('marketplace.installFailed') || 'Installation failed: ') + (data.error || 'Unknown error'))
       }
       break
 
     case 'GIOPIC_UNINSTALL_PLUGIN_RESULT':
       if (data.success) {
         message?.success(t('marketplace.uninstallSuccess') || 'Plugin uninstalled successfully!')
         window.postMessage({ type: 'GIOPIC_GET_INSTALLED_PLUGINS' }, '*')
       } else {
         message?.error((t('marketplace.uninstallFailed') || 'Uninstall failed: ') + (data.error || 'Unknown error'))
       }
       break
 
     case 'GIOPIC_TOGGLE_PLUGIN_RESULT':
       if (data.success) {
         window.postMessage({ type: 'GIOPIC_GET_INSTALLED_PLUGINS' }, '*')
       } else {
          message?.error((t('marketplace.toggleFailed') || 'Operation failed: ') + (data.error || 'Unknown error'))
       }
       break
 
     case 'GIOPIC_GET_INSTALLED_PLUGINS_RESULT':
        if (data && Array.isArray(data.plugins)) {
          const installedIds = new Set(data.plugins.filter((p: any) => p && p.id).map((p: any) => p.id))
          const enabledMap = new Map<string, boolean>(data.plugins.filter((p: any) => p && p.id).map((p: any) => [p.id, Boolean(p.enabled)]))
          
          plugins.value.forEach(p => {
            p.installed = installedIds.has(p.id)
            p.enabled = enabledMap.get(p.id) || false
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
  // Only fetch if not already loaded, though Header usually handles this.
  // We can skip it here to avoid double request since Header.vue is always present.
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
    <!-- Auth Header -->
    <div class="absolute top-4 right-4 z-50">
      <div v-if="authStore.user" class="flex items-center gap-2">
        <NDropdown :options="userOptions" @select="handleUserSelect">
          <div class="flex items-center gap-2 cursor-pointer bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition">
            <NAvatar round size="small" :src="authStore.user.avatar" />
            <span class="font-bold">{{ authStore.user.username }}</span>
          </div>
        </NDropdown>
      </div>
      <div v-else>
        <NButton type="primary" round @click="login">
          <template #icon><div class="i-ph-github-logo" /></template>
          Login with GitHub
        </NButton>
      </div>
    </div>

    <!-- Top Warning Banner for missing extension -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
    >
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
              <NButton type="warning" ghost round tag="a" href="https://github.com/ZenEcho/GioPic_Web_Extension" target="_blank">
                <template #icon><div class="i-ph-download-simple-bold" /></template>
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

      <a href="https://github.com/ZenEcho/GioPic_Web_Extension/blob/main/plugins/plugin_dev_guide.md" target="_blank" class="inline-flex items-center gap-2 px-6 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors decoration-none font-600">
        <div class="i-ph-code" />
        {{ t('marketplace.devGuide') }}
      </a>
    </div>

    <!-- Search and Filter -->
    <div class="flex flex-col md:flex-row gap-4 mb-10 justify-between items-center">
      <div class="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
        <NButton 
          v-for="opt in sortOptions" 
          :key="opt.value"
          :type="sortBy === opt.value ? 'primary' : 'default'"
          secondary
          round
          @click="sortBy = opt.value"
        >
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

    <!-- Plugin Grid -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin text-4xl text-primary">⌛</div>
    </div>
    <NGrid v-else x-gap="24" y-gap="24" cols="1 s:2 m:3" responsive="screen">
      <NGridItem v-for="plugin in filteredPlugins" :key="plugin.id">
        <NCard hoverable class="h-full border-border rounded-xl transition-all hover:-translate-y-1">
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
              <img v-if="plugin.icon.startsWith('http')" :src="plugin.icon" class="w-full h-full object-cover" />
              <div v-else :class="[plugin.icon, 'text-2rem']" />
            </div>
            <div class="flex flex-col items-end">
              <NTag :type="plugin.installed ? (plugin.enabled ? 'success' : 'warning') : 'default'" size="small" round class="mb-1">
                {{ plugin.installed ? (plugin.enabled ? t('marketplace.installed') : t('marketplace.disable')) : t('marketplace.install') }}
              </NTag>
              <span class="text-0.75rem text-text-tertiary">v{{ plugin.version }}</span>
            </div>
          </div>
          
          <h3 class="text-1.2rem font-700 text-text-main mb-2">{{ plugin.name }}</h3>
          <p class="text-text-secondary text-0.9rem mb-4 line-clamp-2 min-h-2.7em">
            {{ plugin.description }}
          </p>
          
          <div class="flex items-center gap-4 text-0.8rem text-text-tertiary mb-6">
            <span class="flex items-center gap-1">
              <NAvatar v-if="plugin.author.avatar" :src="plugin.author.avatar" round size="small" />
              <div v-else class="i-ph-user" /> 
              {{ plugin.author.username || 'Unknown' }}
            </span>
            <span class="flex items-center gap-1">
              <div class="i-ph-download-simple" /> {{ plugin.downloads }}
            </span>
          </div>

          <template #action>
            <div class="flex flex-col gap-2">
              <NButton 
                block 
                :type="plugin.installed ? 'default' : 'primary'"
                :secondary="!plugin.installed"
                @click="handleInstall(plugin)"
                v-if="!plugin.installed"
              >
                {{ t('marketplace.install') }}
              </NButton>
              
              <div v-else class="flex gap-2">
                <NButton 
                  flex-1
                  :type="plugin.enabled ? 'warning' : 'success'"
                  secondary
                  @click="handleToggle(plugin.id, !plugin.enabled)"
                >
                  {{ plugin.enabled ? t('marketplace.disable') : t('marketplace.enable') }}
                </NButton>
                <NButton 
                  type="error"
                  secondary
                  @click="handleUninstall(plugin.id)"
                >
                  {{ t('marketplace.uninstall') }}
                </NButton>
              </div>
            </div>
          </template>
        </NCard>
      </NGridItem>
    </NGrid>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
