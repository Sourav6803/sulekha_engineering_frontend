'use client';

import Link from 'next/link';
import { ExternalLink, SolarPanel, Users } from 'lucide-react';
import { DataTable, type SortOrder } from '@/components/shared/DataTable';
import { installationStatusStyle, ROOF_TYPE_LABEL } from './installationStatus';
import { formatNumber, formatDateShort } from '@/lib/format';
import type { InstallationDocument } from '@/types/installation';
import type { Customer } from '@/types/customer';

interface InstallationTableProps {
  installations: InstallationDocument[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  emptyAction?: React.ReactNode;
}

function customerName(installation: InstallationDocument): string {
  const obj = installation.customer as unknown as (Customer & { customerName?: string }) | undefined;
  if (obj && typeof obj === 'object' && 'name' in obj && obj.name) return String(obj.name);
  return installation.customerNameSnapshot ?? '—';
}

export function InstallationTable({
  installations,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  emptyAction,
}: InstallationTableProps) {
  return (
    <DataTable<InstallationDocument>
      columns={[
        {
          key: 'installationId',
          header: 'Installation',
          sortable: true,
          render: (installation) => (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[var(--primary)]">
                <SolarPanel className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <Link
                  href={`/installations/${installation._id}`}
                  className="font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
                >
                  {installation.installationId}
                </Link>
                {installation.projectNo && (
                  <p className="mt-0.5 text-xs text-[var(--muted-soft)]">Project {installation.projectNo}</p>
                )}
              </div>
            </div>
          ),
        },
        {
          key: 'customer',
          header: 'Customer',
          render: (installation) => (
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--secondary)]">
                <Users className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--foreground)]">{customerName(installation)}</p>
                <p className="mt-0.5 font-mono text-xs text-[var(--muted-soft)]">
                  {installation.customerPhoneSnapshot ?? '—'}
                </p>
              </div>
            </div>
          ),
        },
        {
          key: 'systemSizeKW',
          header: 'System',
          sortable: true,
          hideOnMobile: true,
          render: (installation) => (
            <span className="font-mono text-sm text-[var(--foreground)]">
              {formatNumber(installation.systemSizeKW)} kW
            </span>
          ),
        },
        {
          key: 'roofType',
          header: 'Roof',
          hideOnMobile: true,
          render: (installation) => (
            <span className="text-[var(--muted)]">{ROOF_TYPE_LABEL[installation.roofType] ?? installation.roofType}</span>
          ),
        },
        {
          key: 'installDate',
          header: 'Installed',
          sortable: true,
          hideOnMobile: true,
          render: (installation) => <span className="text-[var(--foreground)]">{formatDateShort(installation.installDate)}</span>,
        },
        {
          key: 'status',
          header: 'Status',
          sortable: true,
          hideOnMobile: true,
          render: (installation) => {
            const status = installationStatusStyle(installation.status);
            return <span className={`badge-pill ${status.className}`}>{status.label}</span>;
          },
        },
        {
          key: 'actions',
          header: '',
          className: 'text-right',
          render: (installation) => (
            <Link
              href={`/installations/${installation._id}`}
              aria-label={`View ${installation.installationId}`}
              className="ghost-button !p-2"
              title="View details"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          ),
        },
      ]}
      data={installations}
      keyField="_id"
      rowId={(installation) => installation._id}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyState={{
        icon: SolarPanel,
        title: 'No installations found',
        description: 'Try adjusting your filters, or create a new installation to generate its suggested BOM.',
        action: emptyAction,
      }}
    />
  );
}