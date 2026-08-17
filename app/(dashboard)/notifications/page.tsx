'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCheck, RefreshCw, Search, BellOff, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { NotificationCard } from '@/components/features/notifications/NotificationCard';
import { useNotifications } from '@/hooks/useNotifications';
import { handleApiError } from '@/lib/errors/handleApiError';

type FilterTab = 'all' | 'unread' | 'scheme' | 'internal';

export default function NotificationsPage() {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    fetchUnified,
    markRead,
    markAllRead,
    fetchPMSuryaGhar,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchInput, setSearchInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredNotifications = useMemo(() => {
    let result = notifications;

    if (activeTab === 'unread') {
      result = result.filter(n => !n.isRead);
    } else if (activeTab === 'scheme') {
      result = result.filter(n => n.type === 'scheme' || n.source !== 'internal');
    } else if (activeTab === 'internal') {
      result = result.filter(n => n.source === 'internal');
    }

    if (searchInput.trim()) {
      const q = searchInput.trim().toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.source.toLowerCase().includes(q)
      );
    }

    return result;
  }, [notifications, activeTab, searchInput]);

  const tabCounts = useMemo(() => ({
    all: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    scheme: notifications.filter(n => n.type === 'scheme' || n.source !== 'internal').length,
    internal: notifications.filter(n => n.source === 'internal').length,
  }), [notifications]);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      await fetchUnified({ page: 1, limit: 50 });
    } catch (err) {
      const message = handleApiError(err);
      toast.error('Could not load notifications', { description: message });
    } finally {
      if (showRefresh) setRefreshing(false);
    }
  }, [fetchUnified]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!active) return;
      await loadData();
    }
    void load();
    return () => {
      active = false;
    };
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchPMSuryaGhar();
      await loadData();
      toast.success('Notifications refreshed');
    } catch {
      toast.error('Could not refresh notifications');
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      toast.success('All notifications marked as read');
    } catch (err) {
      const message = handleApiError(err);
      toast.error('Could not mark all as read', { description: message });
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id);
    } catch (err) {
      const message = handleApiError(err);
      toast.error('Could not mark as read', { description: message });
    }
  };

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: tabCounts.all },
    { key: 'unread', label: 'Unread', count: tabCounts.unread },
    { key: 'scheme', label: 'Scheme Updates', count: tabCounts.scheme },
    { key: 'internal', label: 'Internal', count: tabCounts.internal },
  ];

  if (error) {
    return (
      <PageContainer>
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]} />
        <div className="surface-card mt-8">
          <EmptyState
            icon={BellOff}
            title="Could not load notifications"
            description={error}
            action={
              <button type="button" className="brand-button" onClick={() => loadData()}>
                Try again
              </button>
            }
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Updates</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Notifications</h1>
              <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
                System alerts, scheme updates from PM Surya Ghar, and operational notifications — all in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {unreadCount > 0 && (
                <button type="button" className="neutral-button" onClick={handleMarkAllRead}>
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </button>
              )}
              <button
                type="button"
                className="brand-button"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      }
    >
      {/* Filters */}
      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--border-soft)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'bg-white text-[var(--muted)] border border-[var(--border)] hover:border-[var(--primary-soft)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {tab.label}
                  {tab.count != null && tab.count > 0 && (
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[var(--surface-muted)] text-[var(--muted)]'
                    }`}>
                      {tab.count > 99 ? '99+' : tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
              <input
                className="form-input !pl-10 w-full sm:w-64"
                placeholder="Search notifications..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search notifications"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-soft)]">Total notifications</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-[var(--foreground)]">{tabCounts.all}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-soft)]">Unread</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-[var(--error)]">{tabCounts.unread}</p>
        </div>
        <div className="surface-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-soft)]">Scheme updates</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-[var(--primary-active)]">{tabCounts.scheme}</p>
        </div>
      </div>

      {/* Notification list */}
      <section className="surface-card overflow-hidden p-2 sm:p-4">
        {loading && filteredNotifications.length === 0 ? (
          <div className="space-y-4 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={BellOff}
              title="No notifications"
              description={
                searchInput
                  ? 'No notifications match your search. Try different keywords.'
                  : activeTab === 'unread'
                    ? 'All caught up! No unread notifications.'
                    : activeTab === 'scheme'
                      ? 'No scheme updates available right now.'
                      : 'No notifications to display.'
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </section>

      {/* PM Surya Ghar info card */}
      {activeTab === 'all' || activeTab === 'scheme' ? (
        <section className="surface-card overflow-hidden p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--success-tint)] text-[var(--success)]">
              <Globe className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">PM Surya Ghar Muft Bijli Yojana</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                These notifications include official updates from the Government of India&apos;s rooftop solar scheme. For the latest information, visit the official portal.
              </p>
              <a
                href="https://www.pmsuryaghar.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary-active)] transition-colors hover:text-[var(--primary)]"
              >
                Visit official portal
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}
