<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@common/stores/auth'
import { NButton, NAvatar, NDropdown } from 'naive-ui'
import { useAdminTheme } from '@backstage/composables/useAdminTheme'

const { t, locale } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const { isDark, toggleDark } = useAdminTheme()

const languageOptions = [
  { label: '简体中文', key: 'zh-CN' },
  { label: 'English', key: 'en' }
]

const userOptions = computed(() => [
  { label: authStore.user?.username || 'Admin', key: 'username', disabled: true },
  { type: 'divider', key: 'd1' },
  { label: '返回前台', key: 'frontend' },
  { label: t('auth.logout'), key: 'logout' }
])

const handleLanguageSelect = (key: string) => {
  locale.value = key
}

const handleUserSelect = (key: string) => {
  if (key === 'frontend') {
    router.push('/plugins')
  } else if (key === 'logout') {
    authStore.logout()
    void router.push('/login')
  }
}
</script>

<template>
  <div class="flex-1 flex justify-between items-center w-full">
    <div class="flex items-center gap-4">
      <!-- Breadcrumb area -->
    </div>
    
    <div class="flex items-center gap-4">
      <NButton quaternary circle @click="toggleDark()">
        <template #icon>
          <div :class="isDark ? 'i-ph-sun-duotone' : 'i-ph-moon-duotone'" />
        </template>
      </NButton>
      
      <NDropdown trigger="click" :options="languageOptions" @select="handleLanguageSelect">
        <NButton quaternary circle>
          <template #icon>
            <div class="i-ph-translate-duotone" />
          </template>
        </NButton>
      </NDropdown>
      
      <NDropdown trigger="click" :options="userOptions" @select="handleUserSelect">
        <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 pr-3 rounded-full transition-colors ml-2">
          <NAvatar round size="small" :src="authStore.user?.avatar ?? undefined" fallback-src="https://api.dicebear.com/7.x/adventurer/svg?seed=Admin" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ authStore.user?.username || 'Admin' }}</span>
        </div>
      </NDropdown>
    </div>
  </div>
</template>

