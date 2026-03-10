<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NCard, NInput, NTag } from 'naive-ui'
import type { UserRow } from '@common/types'

const props = defineProps<{
  userKeyword: string
  filteredUsers: UserRow[]
  formatDate: (value?: string | null) => string
  isAdminUser: (user: UserRow) => boolean
  isBannedUser: (user: UserRow) => boolean
  onToggleUserAdmin: (user: UserRow) => void
  onToggleUserBan: (user: UserRow) => void
}>()

const emit = defineEmits<{
  (event: 'update:userKeyword', value: string): void
}>()

const userKeywordModel = computed({
  get: () => props.userKeyword,
  set: (value: string) => emit('update:userKeyword', value),
})
</script>

<template>
  <section class="p-1 max-w-7xl mx-auto">
    <div class="mb-6 max-w-xl">
      <NInput v-model:value="userKeywordModel" placeholder="搜索 用户名 / 邮箱 / GitHub ID / 用户 ID" clearable />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NCard v-for="user in filteredUsers" :key="user.id" class="shadow-sm rounded-xl border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-gray-50 dark:border-gray-800/50">
          <div>
            <strong class="text-lg font-medium text-gray-800 dark:text-gray-200">{{ user.username }}</strong>
            <small class="block text-gray-500 mt-0.5">{{ user.id }}</small>
          </div>
          <div class="flex flex-col gap-2 items-end shrink-0">
            <NTag :type="isAdminUser(user) ? 'success' : 'default'" round size="small">{{ isAdminUser(user) ? '管理员' : '普通用户' }}</NTag>
            <NTag :type="isBannedUser(user) ? 'error' : 'success'" round size="small">{{ isBannedUser(user) ? '已封禁' : '正常' }}</NTag>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm mb-5 text-gray-600 dark:text-gray-300">
          <div>
            <strong class="block text-gray-900 dark:text-gray-100 font-semibold">账号类型</strong>
            {{ user.accountType === 'MIXED' ? '混合登录' : user.accountType === 'GITHUB' ? 'GitHub OAuth' : user.accountType === 'GOOGLE' ? 'Google OAuth' : '本地账号' }}
          </div>
          <div>
            <strong class="block text-gray-900 dark:text-gray-100 font-semibold">GitHub ID</strong>
            {{ user.githubId || '-' }}
          </div>
          <div>
            <strong class="block text-gray-900 dark:text-gray-100 font-semibold">邮箱</strong>
            {{ user.email || '-' }}
          </div>
          <div>
            <strong class="block text-gray-900 dark:text-gray-100 font-semibold">状态</strong>
            {{ user.status }}
          </div>
          <div>
            <strong class="block text-gray-900 dark:text-gray-100 font-semibold">插件数量</strong>
            {{ user.pluginCount }}
          </div>
          <div>
            <strong class="block text-gray-900 dark:text-gray-100 font-semibold">注册时间</strong>
            {{ formatDate(user.joinedAt) }}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-auto">
          <NButton size="small" secondary @click="onToggleUserAdmin(user)">{{ isAdminUser(user) ? '取消管理员' : '设置管理员' }}</NButton>
          <NButton size="small" :type="isBannedUser(user) ? 'success' : 'warning'" secondary @click="onToggleUserBan(user)">{{ isBannedUser(user) ? '解封用户' : '封禁用户' }}</NButton>
        </div>
      </NCard>
    </div>
  </section>
</template>

