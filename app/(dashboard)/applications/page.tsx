'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, RotateCcw, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { ApplicationTable } from '@/components/features/applications/ApplicationTable';
import { CreditPreCheck } from '@/components/features/applications/CreditPreCheck';
import {
  APPLICATION_STATUS_FALLBACK,
  siteTypeLabelsFromChecklist,
  statusMetaFromChecklist,
} from '@/components/features/applications/applicationDisplay';
import { useApplications } from '@/hooks/useApplications';
import { useAgents } from '@/hooks/useAgents';
import { useAuth } from '@/hooks/useAuth';
import { canEditApplication, canManageAgents, canViewApplications } from '@/lib/permissions';
import type { SortOrder } from '@/components/shared/DataTable';
import type { ApplicationChecklist, ApplicationListQuery, ApplicationStatus } from '@/types/application';

export default function ApplicationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;
  const allowed = canViewApplications(role);
  const isOversight = role === 'admin' || role === 'manager';
  // Only a field agent may draft or change an application, so the office never
  // sees the "New application" entry point at all.
  const canFileApplication = canEditApplication(role);
  // Only an admin may list agents (/agents is admin-only), so the agent filter
  // is an admin tool; a manager sees everyone's applications without it.
  const canFilterByAgent = canManageAgents(role);

  const { applications, pagination, loading, fetchApplications, fetchChecklist } = useApplications();
  const { agents, fetchAgents } = useAgents();

  const [query, setQuery] = useState<ApplicationListQuery>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchInput, setSearchInput] = useState('');
  const [checklist, setChecklist] = useState<ApplicationChecklist | null>(null);
  const [preCheckOpen, setPreCheckOpen] = useState(false);

  // Debounced search → query.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((prev) => ({ ...prev, search: searchInput.trim() || undefined, page: 1 }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Fetch the list whenever the query changes.
  useEffect(() => {
    if (!allowed) return;
    void fetchApplications(query).catch(() => undefined);
  }, [allowed, query, fetchApplications]);

  // The checklist drives the status labels, the tones and the site type names.
  useEffect(() => {
    if (!allowed) return;
    void fetchChecklist().then(setChecklist);
  }, [allowed, fetchChecklist]);

  useEffect(() => {
    if (!canFilterByAgent) return;
    void fetchAgents({ limit: 100, sortBy: 'name', sortOrder: 'asc' }).catch(() => undefined);
  }, [canFilterByAgent, fetchAgents]);

  if (role && !allowed) {
    return (
      <PageContainer className="canvas-warm">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Applications' }]} />
        <EmptyState
          icon={ShieldAlert}
          title="Not authorised"
          description="Consumer applications are only available to field agents, managers and admins. Ask an administrator if you need access."
        />
      </PageContainer>
    );
  }

  const statusMeta = statusMetaFromChecklist(checklist?.statuses);
  const siteTypeLabels = siteTypeLabelsFromChecklist(checklist?.siteTypes);
  const statusOptions = checklist?.statuses?.length
    ? checklist.statuses.map((status) => ({ value: status.value, label: status.label }))
    : (Object.keys(APPLICATION_STATUS_FALLBACK) as ApplicationStatus[]).map((value) => ({
        value,
        label: APPLICATION_STATUS_FALLBACK[value].label,
      }));

  const handleSort = (sortBy: string, sortOrder: SortOrder) => {
    setQuery((prev) => ({ ...prev, sortBy: sortBy as ApplicationListQuery['sortBy'], sortOrder }));
  };

  const resetFilters = () => {
    setSearchInput('');
    setQuery({ page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' });
  };

  const filtersActive = Boolean(query.search || query.status || query.agent);

  return (
    <PageContainer className="canvas-warm">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Applications' }]} />

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Applications</h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {isOversight
              ? 'Every consumer application filed from the field, with the site and where the file has reached.'
              : 'The consumer applications you filed, with the site and where each file has reached.'}
          </p>
        </div>

        {canFileApplication && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="neutral-button inline-flex items-center gap-1.5 px-4 py-2 text-sm"
              onClick={() => setPreCheckOpen(true)}
            >
              <ShieldCheck className="h-4 w-4" /> Credit check
            </button>
            <Link href="/applications/new" className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-sm">
              <Plus className="h-4 w-4" /> New application
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            className="form-input pl-9"
            placeholder="Search application no, consumer, phone or consumer ID"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search applications"
          />
        </div>

        <select
          className="form-input w-auto"
          value={query.status ?? ''}
          onChange={(event) =>
            setQuery((prev) => ({
              ...prev,
              status: (event.target.value || undefined) as ApplicationStatus | undefined,
              page: 1,
            }))
          }
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        {canFilterByAgent && (
          <select
            className="form-input w-auto max-w-[12rem]"
            value={query.agent ?? ''}
            onChange={(event) =>
              setQuery((prev) => ({ ...prev, agent: event.target.value || undefined, page: 1 }))
            }
            aria-label="Filter by agent"
          >
            <option value="">All agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        )}

        {filtersActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="neutral-button inline-flex items-center gap-1.5 px-3 py-2 text-sm"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        )}
      </div>

      <div className="mt-4">
        <ApplicationTable
          applications={applications}
          loading={loading}
          statusMeta={statusMeta}
          siteTypeLabels={siteTypeLabels}
          showAgent={isOversight}
          sortBy={query.sortBy}
          sortOrder={query.sortOrder as SortOrder | undefined}
          onSort={handleSort}
          emptyAction={
            canFileApplication ? (
              <Link href="/applications/new" className="brand-button inline-flex items-center gap-1.5 px-4 py-2 text-sm">
                <Plus className="h-4 w-4" /> New application
              </Link>
            ) : undefined
          }
        />
      </div>

      <div className="px-4">
        <Pagination pagination={pagination} onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))} />
      </div>

      <CreditPreCheck
        open={preCheckOpen}
        onClose={() => setPreCheckOpen(false)}
        onContinue={() => {
          setPreCheckOpen(false);
          router.push('/applications/new');
        }}
      />
    </PageContainer>
  );
}
