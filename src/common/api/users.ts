import type {
  AuthProvider,
  EmailVerificationPolicyState,
  LoginSource,
  UserAccountStatus,
  UserRole,
} from '@common/types';
import apiClient from './client';
import type { ResendVerificationResponse } from './auth';

export interface MyProfile extends EmailVerificationPolicyState {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  pendingEmail: string | null;
  pendingEmailPurpose: 'EMAIL_CHANGE' | 'LOCAL_BIND' | null;
  avatar: string | null;
  bio: string | null;
  role: UserRole;
  status: UserAccountStatus;
  authProvider: AuthProvider;
  accountType: AuthProvider;
  authProviders?: LoginSource[];
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  emailVerifyRequired: boolean;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  passwordUpdatedAt: string | null;
}

export interface UpdateMyProfilePayload {
  username?: string;
  displayName?: string | null;
  avatar?: string | null;
  bio?: string | null;
}

export interface ChangeMyPasswordPayload {
  currentPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangeMyPasswordResult {
  changed: boolean;
  hadPassword: boolean;
}

export interface RequestEmailChangePayload {
  email: string;
}

export interface RequestLocalBindPayload {
  email: string;
  password: string;
  confirmPassword: string;
}

export const fetchMyProfile = () => apiClient.get<MyProfile>('/users/me/profile');

export const updateMyProfile = (payload: UpdateMyProfilePayload) =>
  apiClient.patch<MyProfile>('/users/me/profile', payload);

export const changeMyPassword = (payload: ChangeMyPasswordPayload) =>
  apiClient.patch<ChangeMyPasswordResult>('/users/me/password', payload);

export const requestMyEmailChange = (payload: RequestEmailChangePayload) =>
  apiClient.post('/users/me/email-change/request', payload);

export const resendMyEmailChangeVerification = () =>
  apiClient.post('/users/me/email-change/resend');

export const requestMyLocalBind = (payload: RequestLocalBindPayload) =>
  apiClient.post('/users/me/local-bind/request', payload);

export const resendMyLocalBindVerification = () =>
  apiClient.post('/users/me/local-bind/resend');

export const resendMyVerification = () =>
  apiClient.post<ResendVerificationResponse>('/users/me/resend-verification');

export type OAuthProviderName = 'GITHUB' | 'GOOGLE';

export const unbindMyOAuthProvider = (
  provider: OAuthProviderName | Lowercase<OAuthProviderName>,
) => apiClient.delete<MyProfile>(`/users/me/oauth/${provider.toLowerCase()}`);
