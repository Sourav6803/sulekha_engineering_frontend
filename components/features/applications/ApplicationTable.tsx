'use client';

import { ChevronRight, ClipboardCheck } from 'lucide-react';
import { DataTable, type SortOrder } from '@/components/shared/DataTable';
import { applicationStatusBadgeFor } from './ApplicationStatusBadge';
import { applicationAgentName, type ApplicationStatusMeta } from './applicationDisplay';
import { formatDateShort } from '@/lib/format';
import type { ApplicationDocument } from '@/types/application';

interface ApplicationTableProps {
  applications: ApplicationDocument[];
  loading?: boolean;
  /** Label + tone per status, from /applications/checklist. */
  statusMeta: ApplicationStatusMeta;
  /** Site type value → label, from /applications/checklist. */
  siteTypeLabels: Record<string, string>;
  /** The office list shows who filed each application; the agent sees only their own. */
  showAgent?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  emptyAction?: React.ReactNode;
}

/** Read-only applications table — the same rows an agent sees, scoped by the server. */
export function ApplicationTable({
  applications,
  loading = false,
  statusMeta,
  siteTypeLabels,
  showAgent = false,
  sortBy,
  sortOrder,
  onSort,
  emptyAction,
}: ApplicationTableProps) {
  return (
    <DataTable<ApplicationDocument>
      columns={[
        {
          key: 'applicationNo',
          header: 'Application',
          sortable: true,
          render: (application) => (
            <span className="block max-w-[9rem] truncate font-mono text-sm font-medium text-[var(--foreground)]">
              {application.applicationNo}
            </span>
          ),
        },
        {
          key: 'consumerName',
          header: 'Consumer',
          sortable: true,
          render: (application) => (
            <div className="min-w-0">
              <p className="max-w-[14rem] truncate font-medium text-[var(--foreground)]">
                {application.consumerName}
              </p>
              <p className="mt-0.5 max-w-[14rem] truncate text-xs text-[var(--muted)] sm:hidden">
                {application.phone || '—'}
              </p>
              {showAgent && (
                <p className="mt-0.5 max-w-[14rem] truncate text-xs text-[var(--muted-soft)]">
                  {applicationAgentName(application.agent)}
                </p>
              )}
            </div>
          ),
        },
        {
          key: 'phone',
          header: 'Phone',
          hideOnMobile: true,
          render: (application) => (
            <span className="whitespace-nowrap font-mono text-sm tabular-nums text-[var(--muted)]">
              {application.phone || '—'}
            </span>
          ),
        },
        {
          key: 'siteType',
          header: 'Site',
          hideOnMobile: true,
          render: (application) => (
            <span className="block max-w-[9rem] truncate text-sm text-[var(--muted)]">
              {application.siteType ? siteTypeLabels[application.siteType] ?? application.siteType : '—'}
            </span>
          ),
        },
        {
          key: 'systemSizeKW',
          header: 'kW',
          hideOnMobile: true,
          className: 'text-right',
          render: (application) => (
            <span className="whitespace-nowrap text-sm tabular-nums text-[var(--foreground)]">
              {application.deal?.systemSizeKW != null ? `${application.deal.systemSizeKW} kW` : '—'}
            </span>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          render: (application) => applicationStatusBadgeFor(application.status, statusMeta),
        },
        {
          key: 'createdAt',
          header: 'Date',
          sortable: true,
          hideOnMobile: true,
          render: (application) => (
            <div className="whitespace-nowrap text-sm text-[var(--muted)]">
              <p>{formatDateShort(application.submittedAt ?? application.createdAt)}</p>
              <p className="text-xs text-[var(--muted-soft)]">
                {application.submittedAt ? 'Submitted' : 'Created'}
              </p>
            </div>
          ),
        },
        {
          // The visible affordance for the whole-row link. The overlay anchor
          // itself is rendered by DataTable over the row, so this column is
          // purely decorative.
          key: 'open',
          header: <span className="sr-only">Open</span>,
          className: 'text-right',
          render: () => (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
              <span className="hidden lg:inline">View</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          ),
        },
      ]}
      data={applications}
      keyField="_id"
      rowId={(application) => application._id}
      rowHref={(application) => `/applications/${application._id}`}
      rowAriaLabel={(application) =>
        `View application ${application.applicationNo} for ${application.consumerName}`
      }
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyState={{
        icon: ClipboardCheck,
        title: 'No applications yet',
        description:
          'Consumer applications filed from the field show up here — with the consumer, the site and where the file has reached.',
        action: emptyAction,
      }}
    />
  );
}

export default ApplicationTable;
