import { ref, inject, type InjectionKey, type Ref } from 'vue'
import {
  fetchAdminPlugins,
  fetchAdminUsers,
  fetchPendingPlugins,
} from '@common/api'
import { useMessage } from 'naive-ui'
import { generateDownloadDetails } from '@backstage/composables'
import type { AdminLog, DownloadDetail, PluginEntity, UserRow } from '@common/types'

export interface AdminContext {
  loadingAll: Ref<boolean>
  loadingPending: Ref<boolean>
  usersLoading: Ref<boolean>
  allPlugins: Ref<PluginEntity[]>
  pendingPlugins: Ref<PluginEntity[]>
  adminUsers: Ref<UserRow[]>
  adminLogs: Ref<AdminLog[]>
  downloadRecords: Ref<DownloadDetail[]>
  refreshAll: (withToast?: boolean) => Promise<void>
  addLog: (category: AdminLog['category'], action: string, target: string, result: AdminLog['result'], detail: string) => void
}

export const ADMIN_KEY = Symbol('ADMIN_CONTEXT') as InjectionKey<AdminContext>

export function createAdminContext(): AdminContext {
  const message = useMessage()
  const loadingAll = ref(false)
  const loadingPending = ref(false)
  const usersLoading = ref(false)

  const allPlugins = ref<PluginEntity[]>([])
  const pendingPlugins = ref<PluginEntity[]>([])
  const adminUsers = ref<UserRow[]>([])
  const adminLogs = ref<AdminLog[]>([])
  const logSeed = ref(0)
  const downloadRecords = ref<DownloadDetail[]>([])

  const addLog = (
    category: AdminLog['category'],
    action: string,
    target: string,
    result: AdminLog['result'],
    detail: string
  ) => {
    logSeed.value += 1
    adminLogs.value.unshift({
      id: `log-${logSeed.value}`,
      createdAt: new Date().toISOString(),
      category, action, target, result, detail,
    })
    adminLogs.value = adminLogs.value.slice(0, 150)
  }

  const refreshAll = async (withToast = false) => {
    loadingAll.value = true
    loadingPending.value = true
    usersLoading.value = true
    try {
      const [allRes, pendingRes, usersRes] = await Promise.all([
        fetchAdminPlugins(),
        fetchPendingPlugins(),
        fetchAdminUsers(),
      ])
      allPlugins.value = Array.isArray(allRes.data) ? allRes.data : []
      pendingPlugins.value = Array.isArray(pendingRes.data) ? pendingRes.data : []
      const usersData = usersRes.data as unknown as { items?: UserRow[] }
      adminUsers.value = Array.isArray(usersRes.data)
        ? usersRes.data
        : Array.isArray(usersData?.items)
          ? usersData.items
          : []
      downloadRecords.value = generateDownloadDetails(allPlugins.value)
      
      if (withToast) message.success('数据刷新完成')
    } catch (error) {
      if (withToast) message.error('加载管理员数据失败')
      addLog('plugin', '刷新后台数据', 'workspace', 'FAILED', String((error as Error).message || 'Unknown'))
    } finally {
      loadingAll.value = false
      loadingPending.value = false
      usersLoading.value = false
    }
  }

  return {
    loadingAll,
    loadingPending,
    usersLoading,
    allPlugins,
    pendingPlugins,
    adminUsers,
    adminLogs,
    downloadRecords,
    refreshAll,
    addLog
  }
}

export function useAdminContext() {
  const context = inject(ADMIN_KEY)
  if (!context) {
    throw new Error('useAdminContext must be used within AdminLayout setup')
  }
  return context
}

