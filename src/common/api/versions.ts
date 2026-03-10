import type {
  AdminPluginVersionsResponse,
  PluginVersionsResponse,
  VersionActionsResponse,
} from '@common/types';
import apiClient from './client';

export const fetchPluginVersions = (pluginId: string) =>
  apiClient.get<PluginVersionsResponse>(`/plugins/${pluginId}/versions`);

export const fetchAdminPluginVersions = (
  pluginId: string,
  includeDeleted = true,
) =>
  apiClient.get<AdminPluginVersionsResponse>(`/plugins/${pluginId}/versions`, {
    params: {
      includeDeleted: includeDeleted ? 'true' : 'false',
    },
  });

export const fetchPluginVersionActions = (pluginId: string) =>
  apiClient.get<VersionActionsResponse>(`/plugins/${pluginId}/versions/actions`);

export const rollbackPluginVersion = (
  pluginId: string,
  version: string,
  reason?: string,
) =>
  apiClient.patch(`/plugins/${pluginId}/versions/${encodeURIComponent(version)}/rollback`, {
    reason,
  });

export const deletePluginVersion = (
  pluginId: string,
  version: string,
  reason?: string,
) =>
  apiClient.delete(`/plugins/${pluginId}/versions/${encodeURIComponent(version)}`, {
    params: {
      reason,
    },
  });
