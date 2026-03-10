import type { ReviewResponse } from '@common/types';
import apiClient from './client';

export const fetchPluginReviews = (pluginId: string) =>
  apiClient.get<ReviewResponse>(`/plugins/${pluginId}/reviews`);

export const createPluginReview = (
  pluginId: string,
  payload: { rating: number; content: string },
) => apiClient.post(`/plugins/${pluginId}/reviews`, payload);

export const upsertPluginReviewReply = (
  pluginId: string,
  reviewId: string,
  payload: { content: string },
) => apiClient.patch(`/plugins/${pluginId}/reviews/${reviewId}/reply`, payload);

export const deletePluginReview = (pluginId: string, reviewId: string) =>
  apiClient.delete(`/plugins/${pluginId}/reviews/${reviewId}`);
