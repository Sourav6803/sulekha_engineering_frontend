'use client';

import Link from 'next/link';
import { Download, ExternalLink, FileText, Pencil, Printer, Trash2 } from 'lucide-react';
import { DataTable, type SortOrder } from '@/components/shared/DataTable';
import { QuotationStatusBadge } from './QuotationStatusBadge';
import { kWLabel, structureLabel } from './quotationDisplay';
import { formatINR, formatDateShort } from '@/lib/format';
import type { QuotationDocument } from '@/types/quotation';

interface QuotationTableProps {
  quotations: QuotationDocument[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  onEdit?: (quotation: QuotationDocument) => void;
  onDelete?: (quotation: QuotationDocument) => void;
  onDownloadPdf?: (quotation: QuotationDocument) => void;
  onPrint?: (quotation: QuotationDocument) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canDownload?: boolean;
  emptyAction?: React.ReactNode;
}

export function QuotationTable({
  quotations,
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
  onDownloadPdf,
  onPrint,
  canEdit = false,
  canDelete = false,
  canDownload = false,
  emptyAction,
}: QuotationTableProps) {
  return (
    <DataTable<QuotationDocument>
      columns={[
        {
          key: 'quotationNo',
          header: 'Quotation no',
          sortable: true,
          render: (quotation) => (
            <div className="min-w-0">
              <Link
                href={`/quotations/${quotation._id}`}
                className="font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
              >
                {quotation.quotationNo}
              </Link>
              <p className="text-xs text-[var(--muted)]">
                {quotation.financialYear}
                {quotation.isHistorical ? ' · imported' : ''}
              </p>
            </div>
          ),
        },
        {
          key: 'customerName',
          header: 'Customer',
          sortable: true,
          render: (quotation) => (
            <div className="min-w-0">
              <p className="font-medium text-[var(--foreground)]">{quotation.customerName}</p>
              <p className="text-xs text-[var(--muted)]">
                {quotation.consumerId ? `Consumer ID ${quotation.consumerId}` : quotation.phoneNo || '—'}
              </p>
            </div>
          ),
        },
        {
          key: 'systemSizeKW',
          header: 'System',
          hideOnMobile: true,
          render: (quotation) => (
            <div>
              <p className="text-[var(--foreground)]">{kWLabel(quotation.systemSizeKW)}</p>
              <p className="text-xs text-[var(--muted)]">
                {quotation.panelQty ? `${quotation.panelQty} panels` : '—'}
              </p>
            </div>
          ),
        },
        {
          key: 'structureType',
          header: 'Structure',
          hideOnMobile: true,
          render: (quotation) => (
            <span className="text-[var(--secondary)]">{structureLabel(quotation.structureType)}</span>
          ),
        },
        {
          key: 'amount',
          header: 'Amount',
          sortable: true,
          className: 'text-right',
          render: (quotation) => (
            <span className="font-semibold text-[var(--foreground)]">{formatINR(quotation.amount)}</span>
          ),
        },
        {
          key: 'issueDate',
          header: 'Date',
          sortable: true,
          hideOnMobile: true,
          render: (quotation) => (
            <span className="text-[var(--secondary)]">{formatDateShort(quotation.issueDate)}</span>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          sortable: true,
          render: (quotation) => <QuotationStatusBadge status={quotation.status} />,
        },
        {
          key: 'actions',
          header: '',
          className: 'text-right',
          render: (quotation) => (
            <div className="flex items-center justify-end gap-1">
              {canDownload && (
                <button
                  type="button"
                  title="Download PDF"
                  onClick={() => onDownloadPdf?.(quotation)}
                  className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--primary)]"
                >
                  <Download className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                title="Print"
                onClick={() => onPrint?.(quotation)}
                className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--primary)]"
              >
                <Printer className="h-4 w-4" />
              </button>
              {canEdit && (
                <button
                  type="button"
                  title="Edit"
                  onClick={() => onEdit?.(quotation)}
                  className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--primary)]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              <Link
                href={`/quotations/${quotation._id}`}
                title="Open"
                className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--primary)]"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              {canDelete && (
                <button
                  type="button"
                  title="Delete"
                  onClick={() => onDelete?.(quotation)}
                  className="rounded p-1.5 text-[var(--secondary)] transition-colors hover:text-[var(--error)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ),
        },
      ]}
      data={quotations}
      keyField="_id"
      rowId={(quotation) => quotation._id}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyState={{
        icon: FileText,
        title: 'No quotations yet',
        description: 'Create the first quotation — the number is assigned automatically.',
        action: emptyAction,
      }}
    />
  );
}

export default QuotationTable;
