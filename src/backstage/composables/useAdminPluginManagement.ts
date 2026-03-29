import { computed, ref, watch, type Ref } from 'vue'
import type { MessageApi } from 'naive-ui'
import { deletePlugin, updatePluginVisibility } from '@common/api'
import type { AdminLog, PluginEntity, VisibilityMode } from '@common/types'
import type { AdminStatusFilter } from '@backstage/constants'

type AddLogFn = (
  category: AdminLog['category'],
  action: string,
  target: string,
  result: AdminLog['result'],
  detail: string
) => void

interface UseAdminPluginManagementOptions {
  allPlugins: Ref<PluginEntity[]>
  message: MessageApi
  addLog: AddLogFn
  refreshAll: () => Promise<void>
}

export function useAdminPluginManagement(options: UseAdminPluginManagementOptions) {
  const { allPlugins, message, addLog, refreshAll } = options

  const manageKeyword = ref('')
  const manageAuthor = ref<string | null>(null)
  const manageStatus = ref<AdminStatusFilter>('ALL')
  const selectedManagePluginId = ref('')
  const visibilityReason = ref('')

  const filteredPlugins = computed(() => {
    const keyword = manageKeyword.value.trim().toLowerCase()
    return allPlugins.value.filter((plugin) => {
      const matchKeyword = !keyword ||
        plugin.name.toLowerCase().includes(keyword) ||
        plugin.id.toLowerCase().includes(keyword) ||
        (plugin.author.username || '').toLowerCase().includes(keyword)
      const matchAuthor = !manageAuthor.value || plugin.authorId === manageAuthor.value
      const matchStatus = manageStatus.value === 'ALL' || plugin.versions[0]?.status === manageStatus.value
      return matchKeyword && matchAuthor && matchStatus
    })
  })

  const selectedManagePlugin = computed(() => {
    return allPlugins.value.find((plugin) => plugin.id === selectedManagePluginId.value) || null
  })

  const updateVisibility = async (
    plugin: PluginEntity,
    visible: boolean,
    action: string,
    mode: VisibilityMode = 'NORMAL'
  ) => {
    const reason = visibilityReason.value.trim()
    if (!visible && !reason) {
      message.warning('下架或隐藏时请填写原因')
      return
    }

    try {
      await updatePluginVisibility(plugin.id, {
        isPublic: visible,
        mode,
        reason: reason || undefined,
      })
      addLog('plugin', action, plugin.id, 'SUCCESS', `${mode}: ${visible ? 'isPublic=true' : 'isPublic=false'}${reason ? `, reason=${reason}` : ''}`)
      message.success(`${plugin.name} 已${visible ? '上架' : '下架'}`)
      visibilityReason.value = ''
      await refreshAll()
    } catch (error) {
      const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'PLUGIN_VISIBILITY_ADMIN_DISABLED') {
        message.warning('该插件已被管理员强制下架，请使用“重新上架”解除强制状态')
      } else if (code === 'PLUGIN_VISIBILITY_REASON_REQUIRED') {
        message.warning('下架或隐藏时请填写原因')
      } else if (code === 'PLUGIN_VISIBILITY_REASON_TOO_LONG') {
        message.warning('下架原因过长，请控制在 500 字以内')
      } else {
        message.error('操作失败')
      }
      addLog('plugin', action, plugin.id, 'FAILED', String((error as Error).message || 'Unknown'))
    }
  }

  const removePlugin = async (plugin: PluginEntity) => {
    try {
      await deletePlugin(plugin.id)
      addLog('plugin', '删除插件', plugin.id, 'SUCCESS', '管理员删除')
      message.success('插件已删除')
      await refreshAll()
    } catch (error) {
      addLog('plugin', '删除插件', plugin.id, 'FAILED', String((error as Error).message || 'Unknown'))
      message.error('删除失败')
    }
  }

  watch(filteredPlugins, (rows) => {
    if (!rows.length) {
      selectedManagePluginId.value = ''
      return
    }

    if (!rows.some((row) => row.id === selectedManagePluginId.value)) {
      selectedManagePluginId.value = rows[0]!.id
    }
  }, { immediate: true })

  return {
    manageKeyword,
    manageAuthor,
    manageStatus,
    visibilityReason,
    selectedManagePluginId,
    filteredPlugins,
    selectedManagePlugin,
    updateVisibility,
    removePlugin,
  }
}
