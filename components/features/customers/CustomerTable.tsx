'use client';

import Link from 'next/link';
import { ExternalLink, Pencil, Trash2, Users } from 'lucide-react';
import { DataTable, type SortOrder } from '@/components/shared/DataTable';
import { customerStatusStyle, ROOF_TYPE_LABEL } from './customerStatus';
import { formatNumber } from '@/lib/format';
import type { Customer } from '@/types/customer';

interface CustomerTableProps {
  customers: Customer[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  emptyAction?: React.ReactNode;
}

export function CustomerTable({
  customers,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  emptyAction,
}: CustomerTableProps) {
  return (
    <DataTable<Customer>
      columns={[
        {
          key: 'name',
          header: 'Customer',
          sortable: true,
          render: (customer) => (
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--secondary)]">
                <Users className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <Link
                  href={`/customers/${customer._id}`}
                  className="font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
                >
                  {customer.name}
                </Link>
                <p className="mt-0.5 font-mono text-xs text-[var(--muted-soft)]">{customer.customerId}</p>
              </div>
            </div>
          ),
        },
        {
          key: 'phone',
          header: 'Phone',
          render: (customer) => (
            <div className="min-w-0">
              <span className="font-mono text-sm text-[var(--foreground)]">{customer.phone}</span>
              {customer.email && (
                <p className="mt-0.5 truncate text-xs text-[var(--muted-soft)]">{customer.email}</p>
              )}
            </div>
          ),
        },
        {
          key: 'city',
          header: 'Location',
          hideOnMobile: true,
          render: (customer) => (
            <span className="text-[var(--foreground)]">
              {customer.city}
              {customer.state ? `, ${customer.state}` : ''}
            </span>
          ),
        },
        {
          key: 'systemSizeKW',
          header: 'System',
          sortable: true,
          hideOnMobile: true,
          render: (customer) => (
            <span className="font-mono text-sm text-[var(--foreground)]">
              {formatNumber(customer.systemSizeKW)} kW
            </span>
          ),
        },
        {
          key: 'roofType',
          header: 'Roof type',
          hideOnMobile: true,
          render: (customer) => (
            <span className="text-[var(--muted)]">{ROOF_TYPE_LABEL[customer.roofType] ?? customer.roofType}</span>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          hideOnMobile: true,
          render: (customer) => {
            const status = customerStatusStyle(customer.status);
            return <span className={`badge-pill ${status.className}`}>{status.label}</span>;
          },
        },
        {
          key: 'actions',
          header: '',
          className: 'text-right',
          render: (customer) => (
            <div className="inline-flex items-center gap-1">
              <Link
                href={`/customers/${customer._id}`}
                aria-label={`View ${customer.name}`}
                className="ghost-button !p-2"
                title="View details"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              {canEdit && onEdit && (
                <button
                  type="button"
                  aria-label={`Edit ${customer.name}`}
                  className="ghost-button !p-2"
                  title="Edit"
                  onClick={() => onEdit(customer)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  type="button"
                  aria-label={`Delete ${customer.name}`}
                  className="ghost-button !p-2 text-[var(--error)]"
                  title="Delete"
                  onClick={() => onDelete(customer)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ),
        },
      ]}
      data={customers}
      keyField="_id"
      rowId={(customer) => customer._id}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyState={{
        icon: Users,
        title: 'No customers found',
        description: 'Try adjusting your search or filters, or add a new customer to get started.',
        action: emptyAction,
      }}
    />
  );
}
