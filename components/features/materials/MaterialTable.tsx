'use client';

import Link from 'next/link';
import { ExternalLink, Pencil, PackageOpen, Trash2 } from 'lucide-react';
import { DataTable, type SortOrder } from '@/components/shared/DataTable';
import { StockBadge } from './StockBadge';
import { formatINR } from '@/lib/format';
import type { MaterialDocument, MaterialStatus } from '@/types/material';

interface MaterialTableProps {
  materials: MaterialDocument[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  onEdit?: (material: MaterialDocument) => void;
  onDelete?: (material: MaterialDocument) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  emptyAction?: React.ReactNode;
}

const STATUS_LABEL: Record<MaterialStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'badge-success' },
  inactive: { label: 'Inactive', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  discontinued: { label: 'Discontinued', className: 'badge-warning' },
};

export function MaterialTable({
  materials,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  emptyAction,
}: MaterialTableProps) {
  return (
    <DataTable<MaterialDocument>
      columns={[
        {
          key: 'name',
          header: 'Material',
          sortable: true,
          render: (material) => {
            const imageUrl = material.images?.find((img) => img.isPrimary)?.url ?? material.images?.[0]?.url;
            return (
              <div className="flex items-start gap-3">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={material.name}
                    loading="lazy"
                    className="mt-0.5 h-9 w-9 shrink-0 rounded-full border border-[var(--border-soft)] object-cover"
                  />
                ) : (
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--secondary)]">
                    <PackageOpen className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0">
                  <Link
                    href={`/materials/${material._id}`}
                    className="font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
                  >
                    {material.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-[var(--muted-soft)]">{material.materialCode}</p>
                </div>
              </div>
            );
          },
        },
        {
          key: 'currentStock',
          header: 'Stock',
          sortable: true,
          render: (material) => <StockBadge material={material} />,
        },
        {
          key: 'description',
          header: 'Description',
          hideOnMobile: true,
          render: (material) => (
            <span className="max-w-xs truncate text-sm text-[var(--muted)]" title={material.description}>
              {material.description || '—'}
            </span>
          ),
        },
        {
          key: 'unitCost',
          header: 'Unit cost',
          hideOnMobile: true,
          render: (material) => (
            <span className="font-mono text-sm text-[var(--foreground)]">
              {material.unitCost != null ? formatINR(material.unitCost) : '—'}
            </span>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          hideOnMobile: true,
          render: (material) => {
            const status = STATUS_LABEL[(material.status ?? 'active') as MaterialStatus] ?? STATUS_LABEL.active;
            return <span className={`badge-pill ${status.className}`}>{status.label}</span>;
          },
        },
        {
          key: 'actions',
          header: '',
          className: 'text-right',
          render: (material) => (
            <div className="inline-flex items-center gap-1">
              <Link
                href={`/materials/${material._id}`}
                aria-label={`View ${material.name}`}
                className="ghost-button !p-2"
                title="View details"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              {canEdit && onEdit && (
                <button
                  type="button"
                  aria-label={`Edit ${material.name}`}
                  className="ghost-button !p-2"
                  title="Edit"
                  onClick={() => onEdit(material)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  type="button"
                  aria-label={`Delete ${material.name}`}
                  className="ghost-button !p-2 text-[var(--error)]"
                  title="Delete"
                  onClick={() => onDelete(material)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ),
        },
      ]}
      data={materials}
      keyField="_id"
      rowId={(material) => material._id}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyState={{
        icon: PackageOpen,
        title: 'No materials found',
        description: 'Try adjusting your search or filters, or create a new material to get started.',
        action: emptyAction,
      }}
    />
  );
}
