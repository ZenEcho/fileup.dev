import type { SelectOption } from 'naive-ui'
import type { ModuleItem, PluginStatus } from '@common/types'

export const ADMIN_MODULES: ModuleItem[] = [
  { id: 'dashboard', label: '仪表盘', desc: '平台统计、趋势与排行', icon: 'i-ph-chart-line-up-bold' },
  { id: 'plugin-review', label: '插件审核', desc: '待审、历史、风险检测', icon: 'i-ph-shield-check-bold' },
  { id: 'plugin-management', label: '插件管理', desc: '插件列表和运营操作', icon: 'i-ph-plugs-connected-bold' },
  { id: 'version-management', label: '插件版本管理', desc: '回滚、删除、版本 diff', icon: 'i-ph-stack-bold' },
  { id: 'review-management', label: '插件评价管理', desc: '评价清理与回复管理', icon: 'i-ph-chat-circle-dots-bold' },
  { id: 'user-management', label: '用户管理', desc: '账号统计与状态维护', icon: 'i-ph-users-bold' },
  { id: 'download-stats', label: '下载统计', desc: '总览、排行、明细', icon: 'i-ph-download-simple-bold' },
  { id: 'system-logs', label: '系统日志', desc: '审核与管理员操作日志', icon: 'i-ph-notebook-bold' },
]

export const ADMIN_DEFAULT_MODULE: ModuleItem = ADMIN_MODULES[0]!

export const ADMIN_STATUS_OPTIONS: SelectOption[] = [
  { label: '全部状态', value: 'ALL' },
  { label: '待审核', value: 'PENDING' },
  { label: '已通过', value: 'APPROVED' },
  { label: '需修改', value: 'CHANGES_REQUIRED' },
  { label: '已拒绝', value: 'REJECTED' },
]

export const ADMIN_RATING_OPTIONS: SelectOption[] = [
  { label: '全部评分', value: 'ALL' },
  { label: '5 分', value: 5 },
  { label: '4 分', value: 4 },
  { label: '3 分', value: 3 },
  { label: '2 分', value: 2 },
  { label: '1 分', value: 1 },
]

export type AdminStatusFilter = 'ALL' | PluginStatus
export type AdminRatingFilter = 'ALL' | 1 | 2 | 3 | 4 | 5
