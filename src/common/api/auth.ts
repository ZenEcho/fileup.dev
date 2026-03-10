import type { AuthUser } from '@common/types';
import apiClient, { API_BASE_URL } from './client';

export interface PasswordLoginPayload {
  identifier: string;
  password: string;
  captchaToken?: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  captchaToken: string;
}

export interface AuthTokenResponse {
  access_token: string;
}

export interface RegisterResponse {
  verificationSent: boolean;
  requiresEmailVerification: boolean;
  email: string;
  expiresAt: string | null;
  mailEnabled?: boolean;
  emailVerificationEnforced?: boolean;
  verificationRequiredNow?: boolean;
}

export interface VerifyByCodePayload {
  email: string;
  code: string;
}

export interface VerifyEmailResponse extends AuthTokenResponse {
  verified: boolean;
  email: string;
  userId: string;
  purpose: 'REGISTER' | 'EMAIL_CHANGE' | 'LOCAL_BIND';
}

export interface CaptchaPolicy {
  enabled: boolean;
  provider: 'TURNSTILE' | 'RECAPTCHA';
  siteKey: string | null;
  registerEnabled: boolean;
  loginEnabled: boolean;
}

export interface OAuthBindAuthorizationResponse {
  authorizeUrl: string;
  provider?: 'GITHUB' | 'GOOGLE';
}

export interface ConfirmPasswordResetPayload {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export type EmailVerificationResendReason =
  | 'MAIL_DISABLED'
  | 'VERIFICATION_NOT_REQUIRED';

export interface ResendVerificationResponse {
  resent: boolean;
  email: string;
  alreadyVerified?: boolean;
  reason?: EmailVerificationResendReason;
  mailEnabled?: boolean;
  emailVerificationEnforced?: boolean;
  verificationRequiredNow?: boolean;
}

export const getGithubAuthUrl = () => `${API_BASE_URL}/auth/github`;
export const getGoogleAuthUrl = () => `${API_BASE_URL}/auth/google`;

const buildOAuthCallbackUrl = (
  provider: 'github' | 'google',
  code: string,
  state?: string,
) => {
  const query = new URLSearchParams({
    code,
  });

  if (typeof state === 'string' && state.trim()) {
    query.set('state', state.trim());
  }

  return `${API_BASE_URL}/auth/${provider}/callback?${query.toString()}`;
};

export const getGithubCallbackUrl = (code: string, state?: string) =>
  buildOAuthCallbackUrl('github', code, state);

export const getGoogleCallbackUrl = (code: string, state?: string) =>
  buildOAuthCallbackUrl('google', code, state);

export const fetchAuthMe = () => apiClient.get<AuthUser>('/auth/me');

export const loginWithPassword = (payload: PasswordLoginPayload) =>
  apiClient.post<AuthTokenResponse>('/auth/login', payload);

export const registerWithPassword = (payload: RegisterPayload) =>
  apiClient.post<RegisterResponse>('/auth/register', payload);

export const fetchCaptchaPolicy = () =>
  apiClient.get<CaptchaPolicy>('/auth/captcha/config');

export const verifyEmailByToken = (token: string) =>
  apiClient.get<VerifyEmailResponse>('/auth/email/verify', {
    params: {
      token,
    },
  });

export const verifyEmailByCode = (payload: VerifyByCodePayload) =>
  apiClient.post<VerifyEmailResponse>('/auth/email/verify-code', payload);

export const resendEmailVerification = (email: string) =>
  apiClient.post<ResendVerificationResponse>('/auth/email/resend', { email });

export const createGithubBindAuthorization = () =>
  apiClient.post<OAuthBindAuthorizationResponse>('/auth/github/bind');

export const createGoogleBindAuthorization = () =>
  apiClient.post<OAuthBindAuthorizationResponse>('/auth/google/bind');

export const confirmPasswordReset = (payload: ConfirmPasswordResetPayload) =>
  apiClient.post('/auth/password-reset/confirm', payload);
