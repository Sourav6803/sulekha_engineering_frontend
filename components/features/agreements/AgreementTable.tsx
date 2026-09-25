'use client';

import { FileSignature, Pencil, Trash2 } from 'lucide-react';
import { DataTable, type SortOrder } from '@/components/shared/DataTable';
import { AgreementDocumentActions } from './AgreementDocumentActions';
import { formatINR, formatDateShort } from '@/lib/format';
import type { AgreementDocument } from '@/types/agreement';

interface AgreementTableProps {
  agreements: AgreementDocument[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canDownload?: boolean;
  onEdit?: (agreement: AgreementDocument) => void;
  onDelete?: (agreement: AgreementDocument) => void;
  emptyAction?: React.ReactNode;
}

const consumerIdLabel = (agreement: AgreementDocument) =>
  agreement.consumerId ? `Consumer ID ${agreement.consumerId}` : 'Consumer ID not recorded';

export function AgreementTable({
  agreements,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  canEdit = false,
  canDelete = false,
  canDownload = true,
  onEdit,
  onDelete,
  emptyAction,
}: AgreementTableProps) {
  return (
    <DataTable<AgreementDocument>
      columns={[
        {
          key: 'consumerName',
          header: 'Consumer',
          sortable: true,
          render: (agreement) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-[var(--foreground)]">{agreement.consumerName}</p>
              <p className="truncate text-xs text-[var(--muted)]">{consumerIdLabel(agreement)}</p>
            </div>
          ),
        },
        {
          key: 'address',
          header: 'Address',
          render: (agreement) => (
            <p className="max-w-[280px] truncate text-sm text-[var(--secondary)]" title={agreement.address}>
              {agreement.address}
              {agreement.relationLine ? ` · ${agreement.relationLine}` : ''}
            </p>
          ),
        },
        {
          key: 'quotationNo',
          header: 'Quotation',
          render: (agreement) =>
            agreement.quotationNo ? (
              <span className="text-sm text-[var(--secondary)]">{agreement.quotationNo}</span>
            ) : (
              <span className="text-xs text-[var(--muted)]">—</span>
            ),
        },
        {
          key: 'agreementDate',
          header: 'Date',
          sortable: true,
          render: (agreement) => (
            <span className="text-sm text-[var(--secondary)]">
              {agreement.agreementDate ? formatDateShort(agreement.agreementDate) : '—'}
            </span>
          ),
        },
        {
          key: 'amount',
          header: 'Amount',
          sortable: true,
          render: (agreement) => (
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">{formatINR(agreement.amount)}</p>
              {agreement.paymentSchedule?.length ? (
                <p className="text-xs text-[var(--muted)]">
                  {agreement.paymentSchedule.map((stage) => `${stage.percent}%`).join(' · ')}
                </p>
              ) : null}
            </div>
          ),
        },
        {
          key: 'actions',
          header: '',
          className: 'text-right',
          render: (agreement) => (
            <div className="flex items-center justify-end gap-1">
              <AgreementDocumentActions
                agreementId={agreement._id}
                consumerName={agreement.consumerName}
                compact
                canDownload={canDownload}
              />
              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(agreement)}
                  className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--foreground)]"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(agreement)}
                  className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--error)]"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ),
        },
      ]}
      data={agreements}
      keyField="_id"
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyState={{
        icon: FileSignature,
        title: 'No agreements yet',
        description: 'Create an agreement for a consumer — the four page document is generated from it.',
        action: emptyAction,
      }}
    />
  );
}

export default AgreementTable;
