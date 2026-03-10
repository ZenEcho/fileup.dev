export type UserRole = 'ADMIN' | 'DEVELOPER';
export type AuthProvider = 'GITHUB' | 'GOOGLE' | 'LOCAL' | 'MIXED';
export type LoginSource = 'LOCAL' | 'GITHUB' | 'GOOGLE';
export type UserAccountStatus = 'ACTIVE' | 'BANNED' | 'PENDING';

export interface EmailVerificationPolicyState {
  mailEnabled?: boolean;
  emailVerificationEnforced?: boolean;
  verificationRequiredNow?: boolean;
}

export interface AuthUser extends EmailVerificationPolicyState {
  userId: string;
  username: string;
  displayName?: string | null;
  avatar: string | null;
  role: UserRole;
  email?: string | null;
  pendingEmail?: string | null;
  pendingEmailPurpose?: 'EMAIL_CHANGE' | 'LOCAL_BIND' | null;
  emailVerified?: boolean;
  emailVerifyRequired?: boolean;
  authProvider?: AuthProvider;
  accountType?: AuthProvider;
  authProviders?: LoginSource[];
  status?: UserAccountStatus;
  lastLoginAt?: string | null;
}
