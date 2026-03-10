<script setup lang="ts">
import { h, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NMenu } from 'naive-ui'
import type { MenuOption } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// render function for icons
function renderIcon(iconClass: string) {
  return () => h('div', { class: iconClass })
}

const menuOptions = computed<MenuOption[]>(() => [
  {
    label: t('admin.menu.dashboard'),
    key: 'admin-dashboard',
    icon: renderIcon('i-ph-squares-four-duotone')
  },
  {
    label: t('admin.menu.review'),
    key: 'admin-review',
    icon: renderIcon('i-ph-clipboard-text-duotone')
  },
  {
    label: t('admin.menu.plugins'),
    key: 'admin-plugins',
    icon: renderIcon('i-ph-puzzle-piece-duotone')
  },
  {
    label: t('admin.menu.versions'),
    key: 'admin-versions',
    icon: renderIcon('i-ph-git-commit-duotone')
  },
  {
    label: t('admin.menu.comments'),
    key: 'admin-comments',
    icon: renderIcon('i-ph-chat-circle-dots-duotone')
  },
  {
    label: t('admin.menu.users'),
    key: 'admin-users',
    icon: renderIcon('i-ph-users-duotone')
  },
  {
    label: t('admin.menu.downloads'),
    key: 'admin-downloads',
    icon: renderIcon('i-ph-chart-line-up-duotone')
  },
  {
    label: t('admin.menu.settings'),
    key: 'admin-settings',
    icon: renderIcon('i-ph-gear-six-duotone')
  },
  {
    label: t('admin.menu.logs'),
    key: 'admin-logs',
    icon: renderIcon('i-ph-terminal-window-duotone')
  }
])

const activeKey = computed(() => {
  return String(route.name || 'admin-dashboard')
})

const handleMenuClick = (key: string) => {
  router.push({ name: key })
}
</script>

<template>
  <div
    class="admin-sidebar h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
    <div
      class="admin-brand px-4 text-center h-[60px] flex items-center justify-center border-b border-gray-100 dark:border-gray-800">
      <div
        class="text-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent dark:from-teal-400 dark:to-cyan-400 select-none tracking-wide">
        Admin
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-3 py-4">
      <NMenu :value="activeKey" :options="menuOptions" @update:value="handleMenuClick" class="admin-menu" />
    </div>
  </div>
</template>

<style>
/* Override Naive UI Menu styles for a more modern pill-shaped look */
.admin-menu .n-menu-item-content {
  border-radius: 8px !important;
  margin-bottom: 4px;
}

.admin-menu .n-menu-item-content--selected {
  background: linear-gradient(to right, rgba(20, 184, 166, 0.1), rgba(6, 182, 212, 0.05)) !important;
  color: #0d9488 !important;
  font-weight: 600;
}

.dark .admin-menu .n-menu-item-content--selected {
  background: linear-gradient(to right, rgba(20, 184, 166, 0.2), rgba(6, 182, 212, 0.1)) !important;
  color: #2dd4bf !important;
}

.admin-menu .n-menu-item-content--selected .n-menu-item-content-header {
  color: #0d9488 !important;
}

.dark .admin-menu .n-menu-item-content--selected .n-menu-item-content-header {
  color: #2dd4bf !important;
}

.admin-menu .n-menu-item-content--selected .n-menu-item-content__icon {
  color: #0d9488 !important;
}

.dark .admin-menu .n-menu-item-content--selected .n-menu-item-content__icon {
  color: #2dd4bf !important;
}
</style>
