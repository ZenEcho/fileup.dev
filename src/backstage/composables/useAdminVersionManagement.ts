import { computed, ref, type Ref } from 'vue'
import type { MessageApi } from 'naive-ui'
import {
  deletePluginVersion,
  fetchAdminPluginVersions,
  fetchPluginVersionActions,
  rollbackPluginVersion,
} from '@common/api'
import type { AdminLog, PluginEntity, PluginVersion, VersionAction } from '@common/types'
import { toPrettyJson } from '@common/utils/plugin'

type AddLogFn = (
  category: AdminLog['category'],
  action: string,
  target: string,
  result: AdminLog['result'],
  detail: string
) => void

interface UseAdminVersionManagementOptions {
  allPlugins: Ref<PluginEntity[]>
  message: MessageApi
  addLog: AddLogFn
  refreshAll: () => Promise<void>
}

export function useAdminVersionManagement(options: UseAdminVersionManagementOptions) {
  const { allPlugins, message, addLog, refreshAll } = options

  const selectedVersionPluginId = ref('')
  const versionLoading = ref(false)
  const versionRows = ref<PluginVersion[]>([])
  const versionActionLogs = ref<VersionAction[]>([])
  const versionReason = ref('')
  const diffVisible = ref(false)
  const diffTitle = ref('')
  const diffCode = ref('')

  const activeVersion = computed(() => versionRows.value.find((row) => row.isActive)?.version || '-')

  const canRollback = (row: PluginVersion) => row.status === 'APPROVED' && !row.isActive && !row.deletedAt
  const canDeleteVersion = (row: PluginVersion) => !row.isActive && !row.deletedAt

  const fetchVersionData = async (pluginId: string) => {
    if (!pluginId) return
    versionLoading.value = true
    try {
      const [versionRes, logRes] = await Promise.all([
        fetchAdminPluginVersions(pluginId, true),
        fetchPluginVersionActions(pluginId),
      ])
      versionRows.value = Array.isArray(versionRes.data?.versions) ? versionRes.data.versions : []
      versionActionLogs.value = Array.isArray(logRes.data?.actions) ? logRes.data.actions : []
    } catch {
      message.error('加载版本数据失败')
    } finally {
      versionLoading.value = false
    }
  }

  const showVersionError = (error: unknown, fallback: string) => {
    const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code
    if (code === 'PLUGIN_VERSION_DELETE_ACTIVE_FORBIDDEN') return message.warning('当前生效版本不允许删除')
    if (code === 'PLUGIN_VERSION_DELETE_LAST_APPROVED_FORBIDDEN') return message.warning('至少保留一个已通过版本')
    if (code === 'PLUGIN_VERSION_ALREADY_ACTIVE') return message.warning('目标版本已是生效版本')
    message.error(fallback)
  }

  const rollbackVersion = async (row: PluginVersion) => {
    if (!selectedVersionPluginId.value) return
    try {
      await rollbackPluginVersion(selectedVersionPluginId.value, row.version, versionReason.value.trim() || undefined)
      addLog('version', '回滚版本', `${selectedVersionPluginId.value}@${row.version}`, 'SUCCESS', versionReason.value || '无说明')
      message.success(`已回滚到 v${row.version}`)
      await Promise.all([refreshAll(), fetchVersionData(selectedVersionPluginId.value)])
    } catch (error) {
      addLog('version', '回滚版本', `${selectedVersionPluginId.value}@${row.version}`, 'FAILED', String((error as Error).message || 'Unknown'))
      showVersionError(error, '回滚失败')
    }
  }

  const deleteVersion = async (row: PluginVersion) => {
    if (!selectedVersionPluginId.value) return
    try {
      await deletePluginVersion(selectedVersionPluginId.value, row.version, versionReason.value.trim() || undefined)
      addLog('version', '删除版本', `${selectedVersionPluginId.value}@${row.version}`, 'SUCCESS', versionReason.value || '无说明')
      message.success(`版本 v${row.version} 已删除`)
      await Promise.all([refreshAll(), fetchVersionData(selectedVersionPluginId.value)])
    } catch (error) {
      addLog('version', '删除版本', `${selectedVersionPluginId.value}@${row.version}`, 'FAILED', String((error as Error).message || 'Unknown'))
      showVersionError(error, '删除失败')
    }
  }

  const openDiff = (row: PluginVersion) => {
    const plugin = allPlugins.value.find((item) => item.id === selectedVersionPluginId.value)
    if (!plugin) return
    const active = versionRows.value.find((item) => item.isActive)
    if (!active) return message.warning('当前无生效版本')
    if (active.version === row.version) return message.warning('目标版本与当前生效版本相同')

    const oldContent = plugin.versions.find((item) => item.version === active.version)?.content
    const newContent = plugin.versions.find((item) => item.version === row.version)?.content
    if (!oldContent || !newContent) return message.warning('仅支持比较未删除版本')

    const left = toPrettyJson(oldContent).split('\n')
    const right = toPrettyJson(newContent).split('\n')
    const lines = ['--- 当前生效版本', '+++ 目标版本']
    const len = Math.max(left.length, right.length)

    for (let i = 0; i < len; i += 1) {
      if (left[i] === right[i] && left[i] !== undefined) lines.push(`  ${left[i]}`)
      else {
        if (left[i] !== undefined) lines.push(`- ${left[i]}`)
        if (right[i] !== undefined) lines.push(`+ ${right[i]}`)
      }
    }

    diffTitle.value = `${plugin.name} v${active.version} -> v${row.version}`
    diffCode.value = lines.join('\n')
    diffVisible.value = true
  }

  return {
    selectedVersionPluginId,
    versionLoading,
    versionRows,
    versionActionLogs,
    versionReason,
    diffVisible,
    diffTitle,
    diffCode,
    activeVersion,
    canRollback,
    canDeleteVersion,
    fetchVersionData,
    rollbackVersion,
    deleteVersion,
    openDiff,
  }
}
