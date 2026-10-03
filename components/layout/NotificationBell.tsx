"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Bell, PackageX, Wrench, Truck, FileText, ClipboardList, ExternalLink } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { useNotifications } from "@/hooks/useNotifications";
import { resolveNotificationTarget } from "@/lib/notifications/target";
import type { UnifiedNotification } from "@/types/notification";

const ICONS: Record<string, typeof PackageX> = {
  low_stock: PackageX,
  installation: Wrench,
  purchase: Truck,
  scheme: Bell,
  external: Bell,
  system: Bell,
  // The office filed the consumer's signed quotation / agreement — the one
  // notification here that is addressed to a single agent.
  document: FileText,
  // A field agent has filed an application, and the office has to pick it up.
  application: ClipboardList,
};

const ICON_STYLES: Record<string, string> = {
  low_stock: "bg-[var(--error-tint)] text-[var(--error)]",
  installation: "bg-[var(--primary-tint)] text-[var(--primary-active)]",
  purchase: "bg-[var(--success-tint)] text-[var(--success)]",
  scheme: "bg-[var(--success-tint)] text-[var(--success)]",
  external: "bg-[var(--surface-muted)] text-[var(--secondary)]",
  system: "bg-[var(--primary-tint)] text-[var(--primary-active)]",
  document: "bg-[var(--success-tint)] text-[var(--success)]",
  application: "bg-[var(--primary-tint)] text-[var(--primary-active)]",
};

/** How many the dropdown lists. The rest are a click away on the notifications page. */
const BELL_LIST_LIMIT = 8;

export function NotificationBell() {
  const isOpen = useUIStore((state) => state.notificationMenuOpen);
  const setOpen = useUIStore((state) => state.setNotificationMenuOpen);
  const menuRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, loading, error, fetchUnified, fetchUnreadCount } =
    useNotifications();

  const recentNotifications = useMemo(() => {
    return notifications.slice(0, BELL_LIST_LIMIT);
  }, [notifications]);

  /*
   * The bell used to show a count and never a list.
   *
   * `useNotifications` reads the unread count on mount and nothing else, so
   * `notifications` stayed empty in here and the dropdown answered "No
   * notifications yet" however many the badge claimed. The list is loaded here
   * instead: once on mount, and again whenever the menu is opened — so what is
   * listed is what the server holds at the moment it is looked at, not what it
   * held when the page was loaded.
   */
  useEffect(() => {
    void fetchUnified({ page: 1, limit: BELL_LIST_LIMIT });
  }, [fetchUnified]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchUnified({ page: 1, limit: BELL_LIST_LIMIT });
    void fetchUnreadCount();
  }, [isOpen, fetchUnified, fetchUnreadCount]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, setOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="ghost-button relative !h-10 !w-10 !p-0"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--error)] text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="surface-card absolute right-0 top-full z-50 mt-2 w-80 !rounded-2xl p-0 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-3">
            <p className="font-display text-sm font-semibold text-[var(--foreground)]">Notifications</p>
            {unreadCount > 0 && (
              <span className="badge-pill bg-[var(--primary-tint)] text-[var(--primary-active)]">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {error && recentNotifications.length === 0 ? (
              /*
               * Say which it is. An empty box that could equally mean "nothing has
               * happened" or "the request failed" is how a broken feed goes
               * unnoticed — it is what made this one look like an empty inbox.
               */
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[var(--error)]">{error}</p>
              </div>
            ) : loading && recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[var(--muted)]">Loading notifications…</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[var(--muted)]">No notifications yet</p>
              </div>
            ) : (
              recentNotifications.map((item: UnifiedNotification) => {
                const Icon = ICONS[item.type] ?? Bell;
                const iconStyle = ICON_STYLES[item.type] ?? ICON_STYLES.system;
                /*
                 * Resolved rather than read off `link` directly. The old test here
                 * was "does it start with a slash", and everything that failed it —
                 * the MNRE / PIB / DISCOM scheme updates, which carry a full URL —
                 * fell through to a plain div with no handler at all.
                 */
                const target = resolveNotificationTarget(item);

                const rowClass = `flex gap-3 border-b border-[var(--border-soft)] px-4 py-3 last:border-0 ${
                  !item.isRead ? "bg-[var(--surface-muted)]/30" : ""
                }`;
                const content = (
                  <>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconStyle}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm leading-snug text-[var(--foreground)]">
                        <span className="line-clamp-1">{item.title}</span>
                        {target?.external ? (
                          // Says "this leaves the app" before the tab opens.
                          <ExternalLink className="h-3 w-3 shrink-0 text-[var(--muted-soft)]" aria-hidden="true" />
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted-soft)] line-clamp-1">{item.message}</p>
                      <p className="mt-1 text-xs text-[var(--muted-soft)]">
                        {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {!item.isRead && (
                      <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
                    )}
                  </>
                );

                // Nothing to open: the row stays inert rather than pretending to be
                // a link, which is the honest answer for a staff-wide notice.
                if (!target) {
                  return (
                    <div key={item._id} className={rowClass}>
                      {content}
                    </div>
                  );
                }

                if (target.external) {
                  return (
                    <a
                      key={item._id}
                      href={target.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className={`${rowClass} transition-colors hover:bg-[var(--surface-muted)]`}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item._id}
                    href={target.href}
                    onClick={() => setOpen(false)}
                    className={`${rowClass} transition-colors hover:bg-[var(--surface-muted)]`}
                  >
                    {content}
                  </Link>
                );
              })
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-[var(--border-soft)] px-4 py-3 text-center text-sm font-medium text-[var(--primary-active)] transition-colors hover:bg-[var(--surface-muted)]"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
