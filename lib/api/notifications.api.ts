import type { ApiResponse, PaginatedResponse } from '@/types/api';
import type { NotificationDocument, NotificationQuery, UnifiedNotification } from '@/types/notification';
import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export const notificationsApi = {
  list: (query?: NotificationQuery) =>
    axiosClient
      .get<ApiResponse<PaginatedResponse<NotificationDocument>>>(ENDPOINTS.notifications.root, { params: query })
      .then((response) => response.data),

  getUnreadCount: () =>
    axiosClient.get<ApiResponse<{ unreadCount: number }>>(ENDPOINTS.notifications.unreadCount).then((response) => response.data),

  markRead: (id: string) =>
    axiosClient.put<ApiResponse<NotificationDocument>>(ENDPOINTS.notifications.read(id)).then((response) => response.data),

  markAllRead: () =>
    axiosClient.put<ApiResponse<null>>(ENDPOINTS.notifications.readAll).then((response) => response.data),

  fetchPMSuryaGhar: () =>
    axiosClient.get<ApiResponse<UnifiedNotification[]>>(ENDPOINTS.notifications.pmSuryaGhar).then((response) => response.data),

  getUnified: (query?: NotificationQuery) =>
    axiosClient
      .get<ApiResponse<{ data: UnifiedNotification[]; pagination?: { page: number; limit: number; total: number; pages: number } }>>(ENDPOINTS.notifications.unified, { params: query })
      .then((response) => response.data),
};
