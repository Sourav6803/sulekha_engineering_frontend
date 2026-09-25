'use client';

import Link from 'next/link';
import { ListOrdered, Pencil, Trash2 } from 'lucide-react';
import { DataTable, type SortOrder } from '@/components/shared/DataTable';
import { formatRegisterDate } from './quotationDisplay';
import { formatINR } from '@/lib/format';
import type { QuotationRegisterRow } from '@/types/quotation';

interface QuotationSerialTableProps {
  rows: QuotationRegisterRow[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  onEdit?: (row: QuotationRegisterRow) => void;
  onDelete?: (row: QuotationRegisterRow) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  emptyAction?: React.ReactNode;
}

/**
 * The Quotation SL Number register — the same four columns as the old Excel
 * sheet (SL NO | QUOTATION NO | DETAILS | DATE), now driven by the quotations
 * themselves so a delete in either view removes it from both.
 */
export function QuotationSerialTable({
  rows,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  emptyAction,
}: QuotationSerialTableProps) {
  return (
    <DataTable<QuotationRegisterRow>
      columns={[
        {
          key: 'slNo',
          header: 'Sl no',
          className: 'w-16',
          render: (row) => <span className="text-[var(--muted)]">{row.slNo}</span>,
        },
        {
          key: 'quotationNo',
          header: 'Quotation no',
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <Link
                href={`/quotations/${row.id}`}
                className="font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
              >
                {row.quotationNo}
              </Link>
              {row.isHistorical && (
                <p className="text-xs text-[var(--muted)]">
                  imported{row.importedSlNo ? ` (sheet SL ${row.importedSlNo})` : ''}
                  {row.attachmentCount ? ` · ${row.attachmentCount} file(s)` : ''}
                </p>
              )}
            </div>
          ),
        },
        {
          key: 'details',
          header: 'Details',
          sortable: true,
          render: (row) => (
            <div className="min-w-0">
              <p className="text-[var(--foreground)]">{row.details || '—'}</p>
              {row.consumerId ? <p className="text-xs text-[var(--muted)]">Consumer {row.consumerId}</p> : null}
            </div>
          ),
        },
        {
          key: 'amount',
          header: 'Amount',
          className: 'text-right',
          hideOnMobile: true,
          render: (row) =>
            row.amount === null || row.amount === undefined ? (
              <span className="text-xs text-[var(--muted)]">not recorded</span>
            ) : (
              <span className="text-[var(--foreground)]">{formatINR(row.amount)}</span>
            ),
        },
        {
          key: 'date',
          header: 'Date',
          sortable: true,
          render: (row) =>
            row.date ? (
              <span className="text-[var(--secondary)]">{formatRegisterDate(row.date)}</span>
            ) : (
              <span className="text-[var(--muted)]">—</span>
            ),
        },
        {
          key: 'actions',
          header: '',
          className: 'text-right',
          render: (row) => (
            <div className="flex items-center justify-end gap-1">
              {canEdit && (
                <button
                  type="button"
                  title="Edit"
                  onClick={() => onEdit?.(row)}
                  className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--primary)]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  title="Delete"
                  onClick={() => onDelete?.(row)}
                  className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--error)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ),
        },
      ]}
      data={rows}
      keyField="id"
      rowId={(row) => row.id}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyState={{
        icon: ListOrdered,
        title: 'The register is empty',
        description: 'Every quotation you create appears here, in serial order.',
        action: emptyAction,
      }}
    />
  );
}

export default QuotationSerialTable;
