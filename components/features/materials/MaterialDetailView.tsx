'use client';

import { Boxes, ImagePlus, Scale } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateShort, formatDateTime, formatINR, formatNumber } from '@/lib/format';
import type { MaterialDocument, MaterialStatus, StockLedgerEntry } from '@/types/material';

interface MaterialDetailViewProps {
  material: MaterialDocument;
  history: StockLedgerEntry[];
  historyLoading?: boolean;
  canAdjust?: boolean;
  canUpload?: boolean;
  onAdjustStock: () => void;
  onUploadImage: () => void;
}

const STATUS_LABEL: Record<MaterialStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'badge-success' },
  inactive: { label: 'Inactive', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  discontinued: { label: 'Discontinued', className: 'badge-warning' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-soft)] py-3 last:border-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-right text-sm font-medium text-[var(--foreground)]">{value ?? '—'}</span>
    </div>
  );
}

const supplierLabel = (supplier: MaterialDocument['preferredSupplier']): string => {
  if (!supplier) return '—';
  if (typeof supplier === 'object') {
    return supplier.name || supplier._id;
  }
  return supplier;
};

export function MaterialDetailView({
  material,
  history,
  historyLoading = false,
  canAdjust = false,
  canUpload = false,
  onAdjustStock,
  onUploadImage,
}: MaterialDetailViewProps) {
  const status = STATUS_LABEL[(material.status ?? 'active') as MaterialStatus] ?? STATUS_LABEL.active;
  const primaryImage = material.images?.find((img) => img.isPrimary) ?? material.images?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="surface-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            {primaryImage?.url ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.caption ?? material.name}
                className="h-14 w-14 shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--secondary)]">
                <Boxes className="h-7 w-7" />
              </span>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">{material.name}</h1>
                <span className={`badge-pill ${status.className}`}>{status.label}</span>
              </div>
              {material.description && (
                <p className="mt-1 text-sm text-[var(--muted)]">{material.description}</p>
              )}
              <p className="mt-1 font-mono text-sm text-[var(--muted-soft)]">
                {material.materialCode}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {canUpload && (
              <button type="button" className="neutral-button" onClick={onUploadImage}>
                <ImagePlus className="h-4 w-4" />
                Add image
              </button>
            )}
            {canAdjust && (
              <button type="button" className="brand-button" onClick={onAdjustStock}>
                Adjust stock
              </button>
            )}
          </div>
        </div>

        {/* Stock stat strip */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Current stock</p>
            <p className="mt-3 font-mono text-3xl font-semibold text-[var(--foreground)]">
              {formatNumber(material.currentStock ?? 0)}
            </p>
            <p className="mt-1 font-mono text-xs text-[var(--muted-soft)]">{material.unit}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Reserved</p>
            <p className="mt-3 font-mono text-3xl font-semibold text-[var(--foreground)]">
              {formatNumber(material.reservedStock ?? 0)}
            </p>
            <p className="mt-1 font-mono text-xs text-[var(--muted-soft)]">
              Available {formatNumber(material.availableStock ?? (material.currentStock ?? 0) - (material.reservedStock ?? 0))}
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Unit cost</p>
            <p className="mt-3 font-mono text-3xl font-semibold text-[var(--foreground)]">
              {material.unitCost != null ? formatINR(material.unitCost) : '—'}
            </p>
            <p className="mt-1 text-xs text-[var(--muted-soft)]">
              Min {formatNumber(material.minimumStockLevel ?? 0)} · Max {formatNumber(material.maximumStockLevel ?? 0)}
            </p>
          </div>
        </div>
      </section>

      {/* Primary image */}
      {primaryImage?.url && (
        <section className="surface-card overflow-hidden p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Image</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primaryImage.url}
            alt={primaryImage.caption ?? material.name}
            className="mt-4 max-h-72 rounded-[var(--radius)] border border-[var(--border-soft)] object-contain"
          />
        </section>
      )}

      {/* Details */}
      <section className="surface-card p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Details</h2>
        </div>
        <div className="mt-4 divide-y divide-[var(--border-soft)] sm:grid sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
          <div className="divide-y divide-[var(--border-soft)]">
            <InfoRow label="Description" value={material.description ?? '—'} />
            <InfoRow label="Unit" value={material.unit} />
            <InfoRow label="Consumable" value={material.isConsumable ? 'Yes' : 'No'} />
            <InfoRow label="Preferred supplier" value={supplierLabel(material.preferredSupplier)} />
          </div>
          <div className="divide-y divide-[var(--border-soft)]">
            <InfoRow
              label="Alternate suppliers"
              value={
                Array.isArray(material.alternateSuppliers) && material.alternateSuppliers.length > 0
                  ? material.alternateSuppliers.length
                  : '—'
              }
            />
            <InfoRow label="Created" value={formatDateShort(material.createdAt)} />
            <InfoRow label="Last updated" value={formatDateTime(material.updatedAt)} />
          </div>
        </div>
      </section>

      {/* Stock history */}
      <section className="surface-card overflow-hidden p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-[var(--primary)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Stock history</h2>
        </div>

        {historyLoading ? (
          <div className="skeleton mt-6 h-24 w-full" />
        ) : history.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Scale}
              title="No stock movements yet"
              description="Stock adjustments, receipts and issues will appear here."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
              <thead className="table-head">
                <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-soft)]">
                  <th scope="col" className="px-4 py-2">Date</th>
                  <th scope="col" className="px-4 py-2">Type</th>
                  <th scope="col" className="px-4 py-2 text-right">Qty</th>
                  <th scope="col" className="px-4 py-2 text-right">Balance</th>
                  <th scope="col" className="px-4 py-2">Customer</th>
                  <th scope="col" className="px-4 py-2">Installation</th>
                  <th scope="col" className="px-4 py-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => {
                  const isIn = entry.direction === 'in';
                  return (
                    <tr key={entry._id} className="rounded-[1.25rem] border border-[var(--border)] bg-white shadow-[var(--shadow-xs)]">
                      <td className="px-4 py-3 text-[var(--muted)]">{formatDateTime(entry.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge-pill ${isIn ? 'badge-success' : 'badge-error'}`}>
                          {isIn ? 'In' : 'Out'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${isIn ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                        {isIn ? '+' : '−'}{formatNumber(entry.qty)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">{formatNumber(entry.balanceAfter)}</td>
                      <td className="px-4 py-3 text-[var(--foreground)]">{entry.customerName ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">{entry.installationId ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">{entry.note ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
