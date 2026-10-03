'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Bell, Wrench, ExternalLink, CheckCheck, Globe, Info, AlertTriangle, ArrowUpRight, FileText } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import { notificationActionLabel, resolveNotificationTarget } from '@/lib/notifications/target';
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

/**
 * A type beats a source when the two disagree: the signed-copy notice is internal
 * like the low-stock alerts, but a document is what it is about, and the wrench
 * would say the wrong thing.
 */
const TYPE_ICON: Record<string, typeof Bell> = {
  document: FileText,
};

const TYPE_STYLE: Record<string, string> = {
  document: 'bg-[var(--success-tint)] text-[var(--success)]',
};

/**
 * What to print on the source pill. `internal` is the API's word for it, not a
 * word an agent should have to read.
 */
const SOURCE_LABEL: Record<string, string> = {
  internal: 'Portal',
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
  const Icon = TYPE_ICON[notification.type] ?? SOURCE_ICON[notification.source] ?? Bell;
  const sourceStyle =
    TYPE_STYLE[notification.type] ??
    SOURCE_STYLE[notification.source] ??
    'bg-[var(--surface-muted)] text-[var(--muted)]';
  const priorityStyle = PRIORITY_STYLE[notification.priority] ?? PRIORITY_STYLE.medium;
  const sourceLabel = SOURCE_LABEL[notification.source] ?? notification.source;

  /**
   * Where this notification leads, if anywhere.
   *
   * An in-app destination is navigated to in the tab the reader is already in; an
   * external feed item opens on its own site. Sending both through one
   * `target="_blank"` anchor is how clicking a notice about your own application
   * used to leave a second copy of the portal open behind you. The same resolver
   * drives the header bell, so the two surfaces can no longer disagree about what
   * is clickable.
   */
  const target = resolveNotificationTarget(notification);

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
          <span className={`badge-pill ${sourceStyle}`}>{sourceLabel}</span>
          <span className={`badge-pill ${priorityStyle} capitalize`}>{notification.priority}</span>
          <span className="text-xs text-[var(--muted-soft)]">{timeLabel}</span>
        </div>

        {/* Actions */}
        {!compact && (
          /*
           * Shown always on a narrow screen, revealed on hover above `sm`. These
           * used to be hover-only, which meant a phone — with no pointer to hover
           * with — could not reach the link or even mark a notice read, and a
           * keyboard could not reach them either. `focus-within` fixes the second.
           */
          <div className="mt-3 flex items-center gap-2 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
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
            {target && !target.external && (
              <Link
                href={target.href}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                {notificationActionLabel(notification)}
              </Link>
            )}
            {target && target.external && (
              <a
                href={target.href}
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
