'use client';

import Link from 'next/link';
import { ExternalLink, Pencil, Trash2, Building2 } from 'lucide-react';
import { DataTable, type SortOrder } from '@/components/shared/DataTable';
import { formatINR } from '@/lib/format';
import type { SupplierDocument, SupplierStatus } from '@/types/supplier';

interface SupplierTableProps {
  suppliers: SupplierDocument[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  onEdit?: (supplier: SupplierDocument) => void;
  onDelete?: (supplier: SupplierDocument) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  emptyAction?: React.ReactNode;
}

const STATUS_LABEL: Record<SupplierStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'badge-success' },
  inactive: { label: 'Inactive', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  suspended: { label: 'Suspended', className: 'badge-warning' },
  blacklisted: { label: 'Blacklisted', className: 'badge-error' },
};

export function SupplierTable({
  suppliers,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  emptyAction,
}: SupplierTableProps) {
  return (
    <DataTable<SupplierDocument>
      columns={[
        {
          key: 'name',
          header: 'Supplier',
          sortable: true,
          render: (supplier) => (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--secondary)]">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <Link
                  href={`/suppliers/${supplier._id}`}
                  className="font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
                >
                  {supplier.name}
                </Link>
                <p className="mt-0.5 font-mono text-xs text-[var(--muted-soft)]">{supplier.supplierId}</p>
              </div>
            </div>
          ),
        },
        {
          key: 'phone',
          header: 'Contact',
          hideOnMobile: true,
          render: (supplier) => (
            <div>
              <p className="font-mono text-sm text-[var(--foreground)]">{supplier.phone}</p>
              {supplier.email && (
                <p className="mt-0.5 text-xs text-[var(--muted-soft)] truncate max-w-[200px]">{supplier.email}</p>
              )}
            </div>
          ),
        },
        {
          key: 'city',
          header: 'Location',
          hideOnMobile: true,
          render: (supplier) => (
            <span className="text-[var(--muted)]">
              {supplier.city}, {supplier.state}
            </span>
          ),
        },
        {
          key: 'businessType',
          header: 'Type',
          hideOnMobile: true,
          render: (supplier) => (
            <span className="text-[var(--muted)] capitalize">
              {supplier.businessType?.replace('_', ' ') ?? '—'}
            </span>
          ),
        },
        {
          key: 'creditLimit',
          header: 'Credit limit',
          hideOnMobile: true,
          sortable: true,
          render: (supplier) => (
            <span className="font-mono text-sm text-[var(--foreground)]">
              {supplier.creditLimit != null ? formatINR(supplier.creditLimit) : '—'}
            </span>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          hideOnMobile: true,
          render: (supplier) => {
            const status = STATUS_LABEL[(supplier.status ?? 'active') as SupplierStatus] ?? STATUS_LABEL.active;
            return <span className={`badge-pill ${status.className}`}>{status.label}</span>;
          },
        },
        {
          key: 'actions',
          header: '',
          className: 'text-right',
          render: (supplier) => (
            <div className="inline-flex items-center gap-1">
              <Link
                href={`/suppliers/${supplier._id}`}
                aria-label={`View ${supplier.name}`}
                className="ghost-button !p-2"
                title="View details"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              {canEdit && onEdit && (
                <button
                  type="button"
                  aria-label={`Edit ${supplier.name}`}
                  className="ghost-button !p-2"
                  title="Edit"
                  onClick={() => onEdit(supplier)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  type="button"
                  aria-label={`Delete ${supplier.name}`}
                  className="ghost-button !p-2 text-[var(--error)]"
                  title="Delete"
                  onClick={() => onDelete(supplier)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ),
        },
      ]}
      data={suppliers}
      keyField="_id"
      rowId={(supplier) => supplier._id}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyState={{
        icon: Building2,
        title: 'No suppliers found',
        description: 'Try adjusting your search or filters, or create a new supplier to get started.',
        action: emptyAction,
      }}
    />
  );
}
