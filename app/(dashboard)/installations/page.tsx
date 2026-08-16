'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, RotateCcw, Search } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Pagination } from '@/components/shared/Pagination';
import { InstallationTable } from '@/components/features/installations/InstallationTable';
import { useInstallations } from '@/hooks/useInstallations';
import { useAuth } from '@/hooks/useAuth';
import { canManageInstallations } from '@/lib/permissions';
import { ROOF_TYPE_LABEL } from '@/components/features/installations/installationStatus';
import type { InstallationListQuery } from '@/lib/api/installations.api';
import type { InstallationStatus } from '@/types/installation';
import type { RoofType } from '@/types/customer';
import type { SortOrder } from '@/components/shared/DataTable';

const STATUSES: InstallationStatus[] = [
  'pending_quotation',
  'quoted',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
];
const ROOF_TYPES: RoofType[] = ['rcc_rooftop', 'tin_shed', 'ground_mount'];

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'installDate', label: 'Install date' },
  { value: 'createdAt', label: 'Recently added' },
  { value: 'systemSizeKW', label: 'System size' },
  { value: 'status', label: 'Status' },
];

export default function InstallationsPage() {
  const { user } = useAuth();
  const role = user?.role;
  const canCreate = canManageInstallations(role);

  const { installations, pagination, loading, fetchInstallations } = useInstallations();

  const [query, setQuery] = useState<InstallationListQuery>({ page: 1, limit: 20, sortBy: 'installDate', sortOrder: 'desc' });
  const [searchInput, setSearchInput] = useState('');

  // Debounced search → query.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((prev) => ({ ...prev, search: searchInput.trim() || undefined, page: 1 }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Fetch the list whenever the query changes.
  const fetch = useCallback(() => fetchInstallations(query), [query, fetchInstallations]);
  useEffect(() => {
    void fetch();
  }, [fetch]);

  const activeFilterCount = useMemo(
    () =>
      Number(Boolean(query.status)) +
      Number(Boolean(query.roofType)) +
      Number(Boolean(query.dateFrom || query.dateTo)) +
      Number(Boolean(query.search)),
    [query.status, query.roofType, query.dateFrom, query.dateTo, query.search]
  );

  const resetFilters = () => {
    setSearchInput('');
    setQuery({ page: 1, limit: 20, sortBy: 'installDate', sortOrder: 'desc' });
  };

  const handleSort = (sortBy: string, sortOrder: SortOrder) => {
    setQuery((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const handlePageChange = (page: number) => {
    setQuery((prev) => ({ ...prev, page }));
  };

  return (
    <PageContainer
      header={
        <div className="space-y-4">
          <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Installations' }]} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Projects</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">Installations</h1>
              <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">
                Track every solar installation, its suggested BOM and the materials actually confirmed on site.
              </p>
            </div>
            {canCreate && (
              <Link href="/installations/new" className="brand-button">
                <Plus className="h-4 w-4" />
                New installation
              </Link>
            )}
          </div>
        </div>
      }
    >
      {/* Filters */}
      <section className="surface-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-soft)]" />
            <input
              className="form-input !pl-11"
              placeholder="Search by ID, project no or quotation…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search installations"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto lg:flex">
            <select
              className="form-input"
              value={query.status ?? ''}
              onChange={(e) =>
                setQuery((prev) => ({ ...prev, status: (e.target.value || undefined) as InstallationStatus | undefined, page: 1 }))
              }
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>

            <select
              className="form-input"
              value={query.roofType ?? ''}
              onChange={(e) =>
                setQuery((prev) => ({ ...prev, roofType: (e.target.value || undefined) as RoofType | undefined, page: 1 }))
              }
              aria-label="Filter by roof type"
            >
              <option value="">All roofs</option>
              {ROOF_TYPES.map((r) => (
                <option key={r} value={r}>
                  {ROOF_TYPE_LABEL[r]}
                </option>
              ))}
            </select>

            <input
              className="form-input"
              type="date"
              value={query.dateFrom ?? ''}
              onChange={(e) => setQuery((prev) => ({ ...prev, dateFrom: e.target.value || undefined, page: 1 }))}
              aria-label="From date"
              title="From date"
            />
            <input
              className="form-input"
              type="date"
              value={query.dateTo ?? ''}
              onChange={(e) => setQuery((prev) => ({ ...prev, dateTo: e.target.value || undefined, page: 1 }))}
              aria-label="To date"
              title="To date"
            />

            <select
              className="form-input"
              value={query.sortBy ?? 'installDate'}
              onChange={(e) => setQuery((prev) => ({ ...prev, sortBy: e.target.value || undefined, page: 1 }))}
              aria-label="Sort installations"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
          </div>

          {activeFilterCount > 0 && (
            <button type="button" onClick={resetFilters} className="ghost-button shrink-0 !justify-center">
              <RotateCcw className="h-4 w-4" />
              Clear filters ({activeFilterCount})
            </button>
          )}
        </div>
      </section>

      {/* Table */}
      <section className="surface-card overflow-hidden p-2 sm:p-4">
        <InstallationTable
          installations={installations}
          loading={loading}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder}
          onSort={handleSort}
          emptyAction={
            canCreate ? (
              <Link href="/installations/new" className="brand-button">
                <Plus className="h-4 w-4" />
                New installation
              </Link>
            ) : undefined
          }
        />
        <div className="px-4">
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </section>
    </PageContainer>
  );
}