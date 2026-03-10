import { ref, reactive } from 'vue'
import type { Ref } from 'vue'
import { useMessage } from 'naive-ui'
import { fetchAdminPlugins, fetchAdminUsers, fetchPendingPlugins, auditPluginVersion } from '@common/api'
import { generateDownloadDetails } from '@backstage/composables'
import type { AdminLog, DownloadDetail, PendingItem, PluginEntity, PluginStatus, UserRow } from '@common/types'

export function useAdminData(options: {
  selectedManagePluginId: Ref<string | null>
  selectedVersionPluginId: Ref<string | null>
  selectedReviewPluginId: Ref<string | null>
  message: ReturnType<typeof useMessage>
}) {
  const booting = ref(true)
  const loadingAll = ref(false)
  const loadingPending = ref(false)
  const usersLoading = ref(false)
  const nowLabel = ref('')

  const allPlugins = ref<PluginEntity[]>([])
  const pendingPlugins = ref<PluginEntity[]>([])
  const reviewOpinionMap = reactive<Record<string, string>>({})
  const adminLogs = ref<AdminLog[]>([])
  const logSeed = ref(0)

  const downloadRecords = ref<DownloadDetail[]>([])
  const downloadRange = ref<7 | 30>(7)
  const downloadPlugin = ref<string | null>(null)
  const downloadKeyword = ref('')

  const adminUsers = ref<UserRow[]>([])

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
      category,
      action,
      target,
      result,
      detail,
    })
    if (adminLogs.value.length > 150) {
      adminLogs.value = adminLogs.value.slice(0, 150)
    }
  }

  async function refreshAll(withToast = false) {
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

      const firstId = allPlugins.value[0]?.id || ''
      if (!options.selectedManagePluginId.value) options.selectedManagePluginId.value = firstId
      if (!options.selectedVersionPluginId.value) options.selectedVersionPluginId.value = firstId
      if (!options.selectedReviewPluginId.value) options.selectedReviewPluginId.value = firstId

      if (withToast) options.message.success('数据刷新完成')
    } catch (error) {
      options.message.error('加载管理员数据失败')
      addLog('plugin', '刷新后台数据', 'workspace', 'FAILED', String((error as Error).message || 'Unknown'))
    } finally {
      loadingAll.value = false
      loadingPending.value = false
      usersLoading.value = false
      nowLabel.value = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full', timeStyle: 'short' }).format(new Date())
    }
  }

  const auditPending = async (item: PendingItem, status: PluginStatus) => {
    if (status === 'PENDING') return
    try {
      await auditPluginVersion(item.plugin.id, item.version.version, status)
      addLog('audit', status === 'APPROVED' ? '审核通过' : '审核拒绝', `${item.plugin.id}@${item.version.version}`, 'SUCCESS', reviewOpinionMap[item.key] || '无意见')
      options.message.success(status === 'APPROVED' ? '审核通过成功' : '审核拒绝成功')
      await refreshAll()
    } catch (error) {
      addLog('audit', status === 'APPROVED' ? '审核通过' : '审核拒绝', `${item.plugin.id}@${item.version.version}`, 'FAILED', String((error as Error).message || 'Unknown'))
      options.message.error('审核失败')
    }
  }

  return {
    booting,
    loadingAll,
    loadingPending,
    usersLoading,
    nowLabel,
    allPlugins,
    pendingPlugins,
    reviewOpinionMap,
    adminLogs,
    downloadRecords,
    downloadRange,
    downloadPlugin,
    downloadKeyword,
    adminUsers,
    addLog,
    refreshAll,
    auditPending,
  }
}
