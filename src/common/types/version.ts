import type { PluginVersion, PluginVersionActionType } from './plugin';

export interface VersionAction {
  id: string;
  action: PluginVersionActionType;
  fromVersion: string | null;
  toVersion: string | null;
  targetVersion: string | null;
  reason: string | null;
  createdAt: string;
  operator: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export interface PluginVersionsResponse {
  pluginId: string;
  activeVersion: string | null;
  versions: PluginVersion[];
}

export interface AdminPluginVersionsResponse {
  versions: PluginVersion[];
}

export interface VersionActionsResponse {
  actions: VersionAction[];
}
