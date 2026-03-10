export interface ReviewUser {
  userId: string | null;
  username: string | null;
  avatar: string | null;
  isAuthor: boolean;
  isAdmin?: boolean;
}

export interface PluginReviewReply {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: ReviewUser;
}

export interface PluginReview {
  id: string;
  pluginId: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  reviewer: ReviewUser;
  replies: PluginReviewReply[];
  authorReply?: PluginReviewReply | null;
}

export interface ReviewSummary {
  total: number;
  averageRating: number;
}

export interface ReviewResponse {
  summary?: ReviewSummary;
  reviews?: PluginReview[];
}
