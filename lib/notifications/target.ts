import type { UnifiedNotification } from '@/types/notification';

/**
 * Where a notification should take the reader.
 *
 * Kept in one place because two surfaces show the same feed — the header bell and
 * the notifications page — and they had drifted apart: the page rendered a link
 * for both kinds, the bell rendered one only for in-app destinations and dropped
 * every external item into a plain `div`, so the scheme updates looked clickable
 * and were not.
 *
 * `link` is the backend's answer when it has one, which is why it wins: the
 * signed-copy notice and the new-application notice are both written with the
 * application they are about. What follows is the fallback for everything else —
 * a destination derived from the type, narrowed by whatever id the notification
 * carries. A notification with nothing to open returns null and the caller leaves
 * the row inert, rather than inventing somewhere to send the reader.
 */
export interface NotificationTarget {
  href: string;
  /** True when the destination is another site and must open in its own tab. */
  external: boolean;
}

/**
 * The screen each type belongs to, for rows that carry no id of their own — older
 * notifications, and the staff-wide ones that are not about a single record.
 *
 * `installation`, `purchase` and `system` are in the model's type enum but nothing
 * writes them yet; they are mapped so that the day something does, it routes
 * instead of lying inert.
 */
const TYPE_SCREEN: Record<string, string> = {
  low_stock: '/materials',
  installation: '/installations',
  purchase: '/purchases',
  application: '/applications',
  document: '/applications',
};

/** The label for the action, so it names the screen the reader is about to get. */
const TYPE_ACTION_LABEL: Record<string, string> = {
  low_stock: 'Open material',
  installation: 'Open installation',
  purchase: 'Open purchases',
  application: 'Open application',
  document: 'Open application',
};

/** The record a notification is about, when it names one. */
const recordHref = (notification: UnifiedNotification): string | null => {
  const metadata = notification.metadata ?? {};
  const idOf = (key: string): string | null => {
    const value = metadata[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  };

  switch (notification.type) {
    case 'low_stock': {
      const materialId = idOf('materialId');
      return materialId ? `/materials/${materialId}` : null;
    }
    case 'installation': {
      const installationId = idOf('installationId');
      return installationId ? `/installations/${installationId}` : null;
    }
    case 'application':
    case 'document': {
      const applicationId = idOf('applicationId');
      return applicationId ? `/applications/${applicationId}` : null;
    }
    default:
      return null;
  }
};

export const resolveNotificationTarget = (
  notification: UnifiedNotification
): NotificationTarget | null => {
  const link = notification.link?.trim();

  if (link) {
    // A leading slash is this app; an absolute http(s) URL is somebody else's site.
    if (link.startsWith('/')) {
      return { href: link, external: false };
    }

    if (/^https?:\/\//i.test(link)) {
      return { href: link, external: true };
    }

    // Anything else — a bare host, a mailto, a malformed value — is not a
    // destination this component can honour.
    return null;
  }

  const record = recordHref(notification);
  if (record) {
    return { href: record, external: false };
  }

  const screen = TYPE_SCREEN[notification.type];
  return screen ? { href: screen, external: false } : null;
};

/** How the action reads for this notification, e.g. "Open material". */
export const notificationActionLabel = (notification: UnifiedNotification): string =>
  TYPE_ACTION_LABEL[notification.type] ?? 'Open';
