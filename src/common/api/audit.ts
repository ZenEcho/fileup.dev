import type { PluginStatus, UserRole, UserRow, UserStatus } from '@common/types';
import type { ResendVerificationResponse } from './auth';
import apiClient from './client';

export interface AdminUsersQuery {
  keyword?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}

export interface AdminUsersResponse {
  items: UserRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUpdateUserPayload {
  username?: string;
  displayName?: string | null;
  avatar?: string | null;
  email?: string | null;
  bio?: string | null;
  adminNote?: string | null;
}

export const auditPluginVersion = (
  pluginId: string,
  version: string,
  status: PluginStatus,
) =>
  apiClient.patch(`/plugins/${pluginId}/versions/${encodeURIComponent(version)}/audit`, {
    status,
  });

export const fetchAdminUsers = (query: AdminUsersQuery = {}) =>
  apiClient.get<AdminUsersResponse>('/admin/users', {
    params: query,
  });

export const fetchAdminUserDetail = (userId: string) =>
  apiClient.get<UserRow>(`/admin/users/${userId}`);

export const updateAdminUser = (userId: string, payload: AdminUpdateUserPayload) =>
  apiClient.patch<UserRow>(`/admin/users/${userId}`, payload);

export const updateAdminUserRole = (userId: string, role: UserRole) =>
  apiClient.patch<UserRow>(`/admin/users/${userId}/role`, { role });

export const updateAdminUserStatus = (
  userId: string,
  status: Extract<UserStatus, 'ACTIVE' | 'BANNED'>,
) => apiClient.patch<UserRow>(`/admin/users/${userId}/status`, { status });

export const resendAdminUserVerification = (userId: string) =>
  apiClient.post<ResendVerificationResponse>(`/admin/users/${userId}/resend-verification`);

export interface AdminResetPasswordPayload {
  mode: 'LINK' | 'TEMP_PASSWORD';
}

export const resetAdminUserPassword = (
  userId: string,
  payload: AdminResetPasswordPayload,
) => apiClient.post(`/admin/users/${userId}/password-reset`, payload);

export type AdminOAuthProviderName = 'GITHUB' | 'GOOGLE';

export const forceUnbindAdminUserOAuthProvider = (
  userId: string,
  provider: AdminOAuthProviderName | Lowercase<AdminOAuthProviderName>,
) => apiClient.delete<UserRow>(`/admin/users/${userId}/oauth/${provider.toLowerCase()}`);
