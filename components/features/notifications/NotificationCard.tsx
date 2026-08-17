'use client';

import { useMemo } from 'react';
import { Bell, Wrench, ExternalLink, CheckCheck, Globe, Info, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import type { UnifiedNotification } from '@/types/notification';

interface NotificationCardProps {
  notification: UnifiedNotification;
  onMarkRead?: (id: string) => void;
  compact?: boolean;
}

const SOURCE_ICON: Record<string, typeof Bell> = {
  internal: Wrench,
  'PM Surya Ghar': Globe,
  MNRE: Globe,
  PIB: Info,
  DISCOM: AlertTriangle,
};

const SOURCE_STYLE: Record<string, string> = {
  internal: 'bg-[var(--primary-tint)] text-[var(--primary-active)]',
  'PM Surya Ghar': 'bg-[var(--success-tint)] text-[var(--success)]',
  MNRE: 'bg-[var(--surface-muted)] text-[var(--secondary)]',
  PIB: 'bg-[var(--primary-tint)] text-[var(--primary-active)]',
  DISCOM: 'bg-[var(--error-tint)] text-[var(--error)]',
};

const PRIORITY_STYLE: Record<string, string> = {
  low: 'bg-[var(--surface-muted)] text-[var(--muted)]',
  medium: 'bg-[var(--primary-tint)] text-[var(--primary-active)]',
  high: 'bg-[var(--error-tint)] text-[var(--error)]',
};

export function NotificationCard({ notification, onMarkRead, compact = false }: NotificationCardProps) {
  const Icon = SOURCE_ICON[notification.source] ?? Bell;
  const sourceStyle = SOURCE_STYLE[notification.source] ?? 'bg-[var(--surface-muted)] text-[var(--muted)]';
  const priorityStyle = PRIORITY_STYLE[notification.priority] ?? PRIORITY_STYLE.medium;

  const timeLabel = useMemo(() => {
    const dateValue = notification.publishedAt || notification.createdAt;
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return formatDateTime(date?.toISOString?.() ?? dateValue);
  }, [notification.publishedAt, notification.createdAt]);

  return (
    <div
      className={`group relative flex gap-4 rounded-2xl border border-[var(--border-soft)] bg-white/80 p-5 transition-all hover:border-[var(--primary-soft)] hover:shadow-sm ${
        !notification.isRead ? 'ring-1 ring-[var(--primary-soft)]' : ''
      }`}
    >
      {/* Icon */}
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${sourceStyle}`}>
        <Icon className="h-5 w-5" />
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`text-sm font-semibold ${!notification.isRead ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>
            {notification.title}
          </h3>
          {!notification.isRead && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-[var(--muted)] line-clamp-2">
          {notification.message}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`badge-pill ${sourceStyle}`}>{notification.source}</span>
          <span className={`badge-pill ${priorityStyle}`}>{notification.priority}</span>
          <span className="text-xs text-[var(--muted-soft)]">{timeLabel}</span>
        </div>

        {/* Actions */}
        {!compact && (
          <div className="mt-3 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            {!notification.isRead && onMarkRead && (
              <button
                type="button"
                onClick={() => onMarkRead(notification._id)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary-active)] transition-colors hover:text-[var(--primary)]"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark as read
              </button>
            )}
            {notification.link && (
              <a
                href={notification.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Visit source
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
