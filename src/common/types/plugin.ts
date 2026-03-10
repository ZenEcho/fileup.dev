import type { PluginContent } from '@common/utils/plugin';

export type PluginStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface PluginAuthorProfile {
  username?: string;
  avatar?: string | null;
}

export interface PluginVersion {
  id: string;
  version: string;
  status: PluginStatus;
  content?: unknown;
  changelog?: string | null;
  auditLog?: string | null;
  auditorId?: string | null;
  createdAt: string;
  deletedAt?: string | null;
  isActive?: boolean;
}

export interface PluginEntity {
  id: string;
  authorId: string;
  name: string;
  description: string;
  downloads: number | string | bigint;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author: PluginAuthorProfile;
  versions: PluginVersion[];
}

export interface PluginListItem {
  id: string;
  name: string;
  icon?: string | null;
  isPublic: boolean;
  versions: Array<{
    status: PluginStatus;
  }>;
}

export interface PluginMarketplaceItem {
  id: string;
  name: string;
  version: string;
  description: string;
  authorId: string;
  author: {
    username: string;
    avatar?: string;
  };
  icon: string;
  downloads: number;
  installed: boolean;
  enabled: boolean;
  content: unknown;
  updatedAt?: string;
}

export interface CreatePluginPayload {
  id: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  author: string;
  script: string;
  content: PluginContent;
  changelog: string;
}

export type VisibilityMode = 'FORCE' | 'NORMAL';

export interface PluginVisibilityPayload {
  isPublic: boolean;
  mode?: VisibilityMode;
}
