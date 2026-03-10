import type { PluginStatus } from '@common/types';

type PluginStatusType = 'default' | 'success' | 'warning' | 'error';

export function usePluginStatus() {
  const getPluginStatusType = (status?: PluginStatus | string): PluginStatusType => {
    if (status === 'APPROVED') return 'success';
    if (status === 'REJECTED') return 'error';
    if (status === 'PENDING') return 'warning';
    return 'default';
  };

  const getPluginStatusLabel = (status?: PluginStatus | string) => {
    if (status === 'APPROVED') return '已通过';
    if (status === 'REJECTED') return '已拒绝';
    if (status === 'PENDING') return '待审核';
    return '-';
  };

  return {
    getPluginStatusType,
    getPluginStatusLabel,
  };
}
