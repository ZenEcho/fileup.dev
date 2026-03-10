import type {
  AdminCaptchaConfig,
  AdminMailConfig,
  MailTestResult,
  UpdateAdminCaptchaConfigPayload,
  UpdateAdminMailConfigPayload,
} from '@common/types';
import apiClient from './client';

export const fetchAdminMailConfig = () =>
  apiClient.get<AdminMailConfig>('/admin/settings/mail');

export const updateAdminMailConfig = (payload: UpdateAdminMailConfigPayload) =>
  apiClient.patch<AdminMailConfig>('/admin/settings/mail', payload);

export const testAdminMailConfig = (toEmail: string, subject?: string) =>
  apiClient.post<MailTestResult>('/admin/settings/mail/test', {
    toEmail,
    subject,
  });

export const fetchAdminCaptchaConfig = () =>
  apiClient.get<AdminCaptchaConfig>('/admin/settings/captcha');

export const updateAdminCaptchaConfig = (
  payload: UpdateAdminCaptchaConfigPayload,
) => apiClient.patch<AdminCaptchaConfig>('/admin/settings/captcha', payload);
