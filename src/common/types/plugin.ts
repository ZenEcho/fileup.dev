import type { PluginContent, PluginKind } from '@common/utils/plugin';

export type PluginStatus =
  | 'APPROVED'
  | 'PENDING'
  | 'REJECTED'
  | 'CHANGES_REQUIRED';

export type PluginVersionActionType =
  | 'SUBMIT'
  | 'RESUBMIT'
  | 'AUDIT_APPROVED'
  | 'AUDIT_REJECTED'
  | 'AUDIT_CHANGES_REQUIRED'
  | 'VISIBILITY_PUBLIC'
  | 'VISIBILITY_PRIVATE'
  | 'FORCE_UNPUBLISH'
  | 'FORCE_REPUBLISH'
  | 'PLUGIN_DELETE'
  | 'ROLLBACK'
  | 'DELETE';

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
  adminDisabled?: boolean;
  adminDisableReason?: string | null;
  createdAt: string;
  updatedAt: string;
  author: PluginAuthorProfile;
  versions: PluginVersion[];
  versionActionLogs?: Array<{
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
  }>;
}

export interface PluginListItem {
  id: string;
  name: string;
  icon?: string | null;
  isPublic: boolean;
  adminDisabled?: boolean;
  adminDisableReason?: string | null;
  versions: Array<{
    status: PluginStatus;
    version?: string;
    auditLog?: string | null;
  }>;
}

export interface PluginMarketplaceItem {
  id: string;
  kind: PluginKind;
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
  kind?: PluginKind;
  author?: string;
  script?: string;
  targetDriveType?: string;
  editorType?: string;
  displayName?: string;
  detectScript?: string;
  extractScript?: string;
  injectScript?: string;
  content: PluginContent;
  changelog?: string;
}

export type VisibilityMode = 'FORCE' | 'NORMAL';

export interface PluginVisibilityPayload {
  isPublic: boolean;
  mode?: VisibilityMode;
  reason?: string;
}
