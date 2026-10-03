import type { ApiListResponse, ApiResponse } from '@/types/api';
import type { NotificationDocument, NotificationQuery, UnifiedNotification } from '@/types/notification';
import axiosClient from './axiosClient';
import { ENDPOINTS } from './endpoints';

export const notificationsApi = {
  /*
   * `ApiListResponse`, not `ApiResponse<{ items }>`: this backend puts the array in
   * `data` itself and the paging metadata beside it. See the note on that type —
   * the nested shape this used to declare is what made both feeds read as empty.
   */
  list: (query?: NotificationQuery) =>
    axiosClient
      .get<ApiListResponse<NotificationDocument>>(ENDPOINTS.notifications.root, { params: query })
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
      .get<ApiListResponse<UnifiedNotification>>(ENDPOINTS.notifications.unified, { params: query })
      .then((response) => response.data),
};
