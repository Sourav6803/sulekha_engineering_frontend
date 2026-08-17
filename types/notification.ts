export type NotificationType = 'low_stock' | 'installation' | 'purchase' | 'system' | 'scheme' | 'external';
export type NotificationSource = 'internal' | 'PM Surya Ghar' | 'MNRE' | 'PIB' | 'DISCOM';
export type NotificationCategory = 'scheme_update' | 'subsidy' | 'registration' | 'general' | 'alert' | 'info' | 'warning';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface NotificationDocument {
  _id: string;
  type: NotificationType;
  source: NotificationSource;
  title: string;
  message: string;
  link?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  isRead: boolean;
  isExternal: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedNotification extends NotificationDocument {
  publishedAt?: string;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  unread?: boolean;
  type?: string;
  source?: string;
  category?: string;
  priority?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
