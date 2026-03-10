import type { EmailVerificationPolicyState, LoginSource, UserRole } from './auth';
import type { PluginEntity, PluginStatus, PluginVersion } from './plugin';
import type { PluginReview, ReviewSummary } from './review';

export type ModuleId =
  | 'dashboard'
  | 'plugin-review'
  | 'plugin-management'
  | 'version-management'
  | 'review-management'
  | 'user-management'
  | 'download-stats'
  | 'system-logs'
  | 'system-settings';

export interface ModuleItem {
  id: ModuleId;
  label: string;
  desc: string;
  icon: string;
}

export interface PendingItem {
  key: string;
  plugin: PluginEntity;
  version: PluginVersion;
  content: unknown;
}

export interface DownloadDetail {
  id: string;
  pluginId: string;
  pluginName: string;
  ip: string;
  downloadedAt: string;
  count: number;
}

export type UserStatus = 'ACTIVE' | 'BANNED' | 'PENDING';
export type UserAccountType = 'GITHUB' | 'GOOGLE' | 'LOCAL' | 'MIXED';

export interface UserRow extends EmailVerificationPolicyState {
  id: string;
  githubId: string | null;
  email: string | null;
  pendingEmail?: string | null;
  pendingEmailPurpose?: 'EMAIL_CHANGE' | 'LOCAL_BIND' | null;
  username: string;
  displayName?: string | null;
  avatar: string | null;
  bio?: string | null;
  adminNote?: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  emailVerifyRequired?: boolean;
  authProvider: UserAccountType;
  accountType: UserAccountType;
  authProviders?: LoginSource[];
  pluginCount: number;
  reviewCount?: number;
  joinedAt: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
  passwordUpdatedAt?: string | null;
}

export interface AdminLog {
  id: string;
  createdAt: string;
  category: 'audit' | 'plugin' | 'version' | 'review' | 'user';
  action: string;
  target: string;
  result: 'SUCCESS' | 'FAILED';
  detail: string;
}

export interface AdminReviewsResponse {
  summary: ReviewSummary;
  reviews: PluginReview[];
}

export interface AuditHistoryRow {
  key: string;
  pluginId: string;
  pluginName: string;
  version: string;
  status: PluginStatus;
  auditor: string;
  auditLog: string;
  createdAt: string;
}

export type AdminMailProvider = 'SMTP';
export type AdminCaptchaProvider = 'TURNSTILE' | 'RECAPTCHA';

export interface AdminMailConfig {
  id: string;
  provider: AdminMailProvider;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string | null;
  fromEmail: string | null;
  fromName: string | null;
  enabled: boolean;
  smtpPassConfigured: boolean;
  updatedAt: string;
}

export interface UpdateAdminMailConfigPayload {
  provider?: AdminMailProvider;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  clearSmtpPass?: boolean;
  fromEmail?: string;
  fromName?: string;
  enabled?: boolean;
}

export interface MailTestResult {
  success: boolean;
  messageId?: string;
  response?: string;
  errorCode?: string;
  errorMessage?: string;
  durationMs: number;
}

export interface AdminCaptchaConfig {
  id: string;
  provider: AdminCaptchaProvider;
  siteKey: string | null;
  enabled: boolean;
  registerEnabled: boolean;
  loginEnabled: boolean;
  scoreThreshold: number;
  secretConfigured: boolean;
  updatedAt: string;
}

export interface UpdateAdminCaptchaConfigPayload {
  provider?: AdminCaptchaProvider;
  siteKey?: string;
  secret?: string;
  clearSecret?: boolean;
  enabled?: boolean;
  registerEnabled?: boolean;
  loginEnabled?: boolean;
  scoreThreshold?: number;
}




