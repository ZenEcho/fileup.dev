import { computed } from 'vue'
import type { Ref } from 'vue'
import { useDateFormat } from '@common/composables'
import { parseNumber } from '@backstage/composables'
import type {
  DownloadDetail,
  PendingItem,
  PluginEntity,
  PluginStatus,
  PluginVersionActionType,
  UserRow,
} from '@common/types'

export function useAdminMetrics(context: {
  allPlugins: Ref<PluginEntity[]>
  pendingPlugins: Ref<PluginEntity[]>
  adminUsers: Ref<UserRow[]>
  downloadRecords: Ref<DownloadDetail[]>
  downloadRange: Ref<7 | 30>
  downloadPlugin: Ref<string | null>
  downloadKeyword: Ref<string>
}) {
  const { isToday } = useDateFormat({ locale: 'zh-CN' })

  const pendingItems = computed<PendingItem[]>(() => {
    return context.pendingPlugins.value.flatMap((plugin) => {
      return plugin.versions
        .filter((version) => version.status === 'PENDING')
        .map((version) => ({
          key: `${plugin.id}:${version.version}`,
          plugin,
          version,
          content: version.content || {}
        }))
    })
  })

  const totalPlugins = computed(() => context.allPlugins.value.length)
  const totalUsers = computed(() => context.adminUsers.value.length)
  const totalDownloads = computed(() => context.allPlugins.value.reduce((sum, plugin) => sum + parseNumber(plugin.downloads), 0))
  const todayDownloads = computed(() => context.downloadRecords.value.filter((item) => isToday(item.downloadedAt)).reduce((sum, item) => sum + item.count, 0))
  const todayNewPlugins = computed(() => context.allPlugins.value.filter((plugin) => isToday(plugin.createdAt)).length)

  const topPlugins = computed(() => {
    return [...context.allPlugins.value].sort((a, b) => parseNumber(b.downloads) - parseNumber(a.downloads)).slice(0, 8)
  })

  const updatedPlugins = computed(() => {
    return [...context.allPlugins.value].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8)
  })

  const auditActionStatusMap: Partial<Record<PluginVersionActionType, PluginStatus>> = {
    AUDIT_APPROVED: 'APPROVED',
    AUDIT_REJECTED: 'REJECTED',
    AUDIT_CHANGES_REQUIRED: 'CHANGES_REQUIRED',
  }

  const auditRows = computed(() => {
    const rows = context.allPlugins.value.flatMap((plugin) => {
      return (plugin.versionActionLogs || []).flatMap((action) => {
        const status = auditActionStatusMap[action.action]
        if (!status) {
          return []
        }

        return [{
          key: action.id,
          pluginId: plugin.id,
          pluginName: plugin.name,
          version: action.targetVersion || '-',
          status,
          auditor: action.operator?.username || '-',
          auditLog: action.reason || '-',
          createdAt: action.createdAt,
        }]
      })
    })
    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const authorOptions = computed(() => {
    const map = new Map<string, string>()
    context.allPlugins.value.forEach((plugin) => {
      map.set(plugin.authorId, plugin.author.username || plugin.authorId)
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  })

  const pluginOptions = computed(() => {
    return context.allPlugins.value.map((plugin) => ({ label: plugin.name, value: plugin.id }))
  })

  const filteredDownloads = computed(() => {
    const keyword = context.downloadKeyword.value.trim().toLowerCase()
    const now = new Date()
    const min = new Date(now)
    min.setDate(min.getDate() - context.downloadRange.value + 1)
    return context.downloadRecords.value.filter((item) => {
      const time = new Date(item.downloadedAt).getTime()
      const matchRange = time >= min.getTime()
      const matchPlugin = !context.downloadPlugin.value || item.pluginId === context.downloadPlugin.value
      const matchKeyword = !keyword ||
        item.ip.toLowerCase().includes(keyword) ||
        item.pluginName.toLowerCase().includes(keyword) ||
        item.downloadedAt.toLowerCase().includes(keyword)
      return matchRange && matchPlugin && matchKeyword
    }).sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime())
  })

  const trendPoints = computed(() => {
    const days = context.downloadRange.value
    const now = new Date()
    const buckets = new Map<string, number>()
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      buckets.set(d.toISOString().slice(0, 10), 0)
    }
    context.downloadRecords.value.forEach((item) => {
      const key = item.downloadedAt.slice(0, 10)
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + item.count)
    })
    const rows = Array.from(buckets.entries()).map(([key, count]) => ({
      label: key.slice(5).replace('-', '/'),
      count,
    }))
    const max = Math.max(1, ...rows.map((row) => row.count))
    return rows.map((row) => ({ ...row, height: Math.max(8, Math.round((row.count / max) * 100)) }))
  })

  return {
    pendingItems,
    totalPlugins,
    totalUsers,
    totalDownloads,
    todayDownloads,
    todayNewPlugins,
    topPlugins,
    updatedPlugins,
    auditRows,
    authorOptions,
    pluginOptions,
    filteredDownloads,
    trendPoints,
  }
}
