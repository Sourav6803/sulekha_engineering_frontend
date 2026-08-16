import type { ApiResponse, PaginatedResponse } from '@/types/api';
import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export interface NotificationQuery {
  page?: number;
  limit?: number;
  unread?: boolean;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const notificationsApi = {
  list: (query?: NotificationQuery) =>
    axiosClient
      .get<ApiResponse<PaginatedResponse<unknown>>>(ENDPOINTS.notifications.root, { params: query })
      .then((response) => response.data),

  getUnreadCount: () =>
    axiosClient.get<ApiResponse<{ unreadCount: number }>>(ENDPOINTS.notifications.unreadCount).then((response) => response.data),

  markRead: (id: string) =>
    axiosClient.put<ApiResponse<null>>(ENDPOINTS.notifications.read(id)).then((response) => response.data),

  markAllRead: () =>
    axiosClient.put<ApiResponse<null>>(ENDPOINTS.notifications.readAll).then((response) => response.data)
};
