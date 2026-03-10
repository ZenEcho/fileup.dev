import { computed, reactive, ref, type Ref } from 'vue'
import type { MessageApi } from 'naive-ui'
import { updateAdminUserRole } from '@common/api'
import type { AdminLog, UserRow } from '@common/types'

type AddLogFn = (
  category: AdminLog['category'],
  action: string,
  target: string,
  result: AdminLog['result'],
  detail: string
) => void

interface UseAdminUserManagementOptions {
  adminUsers: Ref<UserRow[]>
  message: MessageApi
  addLog: AddLogFn
}

export function useAdminUserManagement(options: UseAdminUserManagementOptions) {
  const { adminUsers, message, addLog } = options

  const userKeyword = ref('')
  const userBanState = reactive<Record<string, boolean>>({})

  const filteredUsers = computed(() => {
    const keyword = userKeyword.value.trim().toLowerCase()
    if (!keyword) return adminUsers.value

    return adminUsers.value.filter((user) => {
      return user.username.toLowerCase().includes(keyword) ||
        user.id.toLowerCase().includes(keyword) ||
        (user.githubId || '').toLowerCase().includes(keyword) ||
        (user.email || '').toLowerCase().includes(keyword)
    })
  })

  const toggleUserAdmin = async (user: UserRow) => {
    const nextRole: UserRow['role'] = user.role === 'ADMIN' ? 'DEVELOPER' : 'ADMIN'
    try {
      const res = await updateAdminUserRole(user.id, nextRole)
      const updated = res.data
      const index = adminUsers.value.findIndex((item) => item.id === user.id)
      if (index >= 0) {
        adminUsers.value[index] = updated
      }

      addLog('user', nextRole === 'ADMIN' ? '设置管理员' : '取消管理员', user.id, 'SUCCESS', `role=${nextRole}`)
      message.success(nextRole === 'ADMIN' ? '已设置为管理员' : '已取消管理员权限')
    } catch (error) {
      addLog('user', nextRole === 'ADMIN' ? '设置管理员' : '取消管理员', user.id, 'FAILED', String((error as Error).message || 'Unknown'))
      message.error('修改用户角色失败')
    }
  }

  const toggleUserBan = (user: UserRow) => {
    userBanState[user.id] = !Boolean(userBanState[user.id])
    addLog('user', userBanState[user.id] ? '封禁用户' : '解封用户', user.id, 'SUCCESS', '前端演示状态')
    message.info('当前为前端演示，待后端接入封禁接口')
  }

  const isAdminUser = (user: UserRow) => user.role === 'ADMIN'
  const isBannedUser = (user: UserRow) => Boolean(userBanState[user.id])

  return {
    userKeyword,
    filteredUsers,
    toggleUserAdmin,
    toggleUserBan,
    isAdminUser,
    isBannedUser,
  }
}
