import type {
  CreatePluginPayload,
  PluginEntity,
  PluginListItem,
  PluginVisibilityPayload,
} from '@common/types';
import apiClient from './client';

export const fetchPluginList = () => apiClient.get<PluginEntity[]>('/plugins');

export const fetchPluginDetail = (pluginId: string, allStatus = false) =>
  apiClient.get<PluginEntity>(`/plugins/${pluginId}`, {
    params: allStatus ? { allStatus: 'true' } : undefined,
  });

export const createPlugin = (payload: CreatePluginPayload) =>
  apiClient.post('/plugins', payload);

export const fetchMyPlugins = () => apiClient.get<PluginListItem[]>('/plugins/my');

export const fetchAdminPlugins = () => apiClient.get<PluginEntity[]>('/plugins/admin/all');

export const fetchPendingPlugins = () => apiClient.get<PluginEntity[]>('/plugins/pending');

export const updatePluginVisibility = (
  pluginId: string,
  payload: PluginVisibilityPayload,
) => apiClient.patch(`/plugins/${pluginId}/visibility`, payload);

export const deletePlugin = (pluginId: string) =>
  apiClient.delete(`/plugins/${pluginId}`);

export const recordPluginDownload = (pluginId: string) =>
  apiClient.post(`/plugins/${pluginId}/download`);
