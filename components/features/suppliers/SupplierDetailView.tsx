'use client';

import { useMemo } from 'react';
import { Building2, Phone, Mail, Globe, MapPin, Star, Calendar } from 'lucide-react';
import { formatINR } from '@/lib/format';
import type { SupplierDocument } from '@/types/supplier';

interface SupplierDetailViewProps {
  supplier: SupplierDocument;
  purchases: unknown[];
  purchasesLoading?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
  onRefetch?: () => void;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'badge-success' },
  inactive: { label: 'Inactive', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  suspended: { label: 'Suspended', className: 'badge-warning' },
  blacklisted: { label: 'Blacklisted', className: 'badge-error' },
};

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  manufacturer: 'Manufacturer',
  distributor: 'Distributor',
  wholesaler: 'Wholesaler',
  retailer: 'Retailer',
  importer: 'Importer',
};

const PAYMENT_TERMS_LABEL: Record<string, string> = {
  advance: 'Advance',
  credit_7_days: 'Credit 7 Days',
  credit_15_days: 'Credit 15 Days',
  credit_30_days: 'Credit 30 Days',
  credit_45_days: 'Credit 45 Days',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-soft)] py-3 last:border-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-right text-sm font-medium text-[var(--foreground)]">{value ?? '—'}</span>
    </div>
  );
}

function SectionTitle({ children, eyebrow }: { children: React.ReactNode; eyebrow?: string }) {
  return (
    <div className="space-y-1">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-soft)]">{eyebrow}</p>}
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{children}</h2>
    </div>
  );
}

export function SupplierDetailView({ supplier, purchases, purchasesLoading = false, canEdit, onEdit, onRefetch }: SupplierDetailViewProps) {
  const status = STATUS_LABEL[(supplier.status ?? 'active')] ?? STATUS_LABEL.active;
  const creditLimit = supplier.creditLimit != null ? supplier.creditLimit : 0;
  const totalPurchases = Array.isArray(purchases) ? purchases.length : 0;

  const bankDetailsPresent = useMemo(() => {
    const b = supplier.bankDetails;
    return Boolean(b && (b.accountHolderName || b.bankName || b.accountNumber || b.ifscCode || b.upiId));
  }, [supplier.bankDetails]);

  const categories = Array.isArray(supplier.categories) ? supplier.categories : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="surface-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--secondary)]">
              <Building2 className="h-7 w-7" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">{supplier.name}</h1>
                <span className={`badge-pill ${status.className}`}>{status.label}</span>
              </div>
              <p className="mt-1 font-mono text-sm text-[var(--muted-soft)]">{supplier.supplierId}</p>
              {supplier.notes && <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">{supplier.notes}</p>}
            </div>
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-3">
              <button type="button" className="brand-button" onClick={onEdit}>
                Edit supplier
              </button>
              {onRefetch && (
                <button type="button" className="neutral-button" onClick={onRefetch}>
                  Refresh
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--border-soft)] bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-soft)]">Credit limit</p>
            <p className="mt-1 font-mono text-lg font-semibold text-[var(--foreground)]">{formatINR(creditLimit)}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-soft)]">Quality rating</p>
            <p className="mt-1 font-mono text-lg font-semibold text-[var(--foreground)]">
              {supplier.qualityRating != null ? `${supplier.qualityRating.toFixed(1)} / 5` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-soft)] bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-soft)]">Purchase records</p>
            <p className="mt-1 font-mono text-lg font-semibold text-[var(--foreground)]">
              {purchasesLoading ? '...' : totalPurchases}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact & Address */}
        <section className="surface-card space-y-0 p-6 sm:p-8">
          <SectionTitle eyebrow="Contact">Contact information</SectionTitle>
          <div className="mt-4">
            <InfoRow label="Phone" value={
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[var(--muted)]" />
                {supplier.phone}
              </span>
            } />
            {supplier.alternatePhone && (
              <InfoRow label="Alternate phone" value={
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--muted)]" />
                  {supplier.alternatePhone}
                </span>
              } />
            )}
            {supplier.email && (
              <InfoRow label="Email" value={
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[var(--muted)]" />
                  {supplier.email}
                </span>
              } />
            )}
            {supplier.website && (
              <InfoRow label="Website" value={
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[var(--muted)]" />
                  {supplier.website}
                </span>
              } />
            )}
            <InfoRow label="Address" value={
              <span className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-[var(--muted)]" />
                <span>{supplier.address}, {supplier.city}, {supplier.state} - {supplier.pincode}</span>
              </span>
            } />
          </div>
        </section>

        {/* Business Details */}
        <section className="surface-card space-y-0 p-6 sm:p-8">
          <SectionTitle eyebrow="Business">Business details</SectionTitle>
          <div className="mt-4">
            <InfoRow label="Business type" value={BUSINESS_TYPE_LABEL[supplier.businessType ?? ''] ?? '—'} />
            <InfoRow label="Payment terms" value={PAYMENT_TERMS_LABEL[supplier.paymentTerms ?? ''] ?? '—'} />
            <InfoRow label="Average delivery" value={
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--muted)]" />
                {supplier.averageDeliveryDays != null ? `${supplier.averageDeliveryDays} days` : '—'}
              </span>
            } />
            <InfoRow label="Quality rating" value={
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[var(--muted)]" />
                {supplier.qualityRating != null ? `${supplier.qualityRating.toFixed(1)} / 5` : '—'}
              </span>
            } />
            <InfoRow label="Categories" value={
              categories.length > 0 ? (
                <div className="flex flex-wrap justify-end gap-1">
                  {categories.map((c) => (
                    <span key={c} className="badge-pill bg-[var(--surface-muted)] text-[var(--muted)]">{c}</span>
                  ))}
                </div>
              ) : '—'
            } />
          </div>
        </section>

        {/* Tax Details */}
        <section className="surface-card space-y-0 p-6 sm:p-8">
          <SectionTitle eyebrow="Tax">Tax information</SectionTitle>
          <div className="mt-4">
            <InfoRow label="GST number" value={supplier.gstNumber ?? '—'} />
            <InfoRow label="PAN number" value={supplier.panNumber ?? '—'} />
          </div>
        </section>

        {/* Bank Details */}
        <section className="surface-card space-y-0 p-6 sm:p-8">
          <SectionTitle eyebrow="Payment">Bank details</SectionTitle>
          <div className="mt-4">
            {bankDetailsPresent ? (
              <>
                {supplier.bankDetails?.accountHolderName && (
                  <InfoRow label="Account holder" value={supplier.bankDetails.accountHolderName} />
                )}
                {supplier.bankDetails?.bankName && (
                  <InfoRow label="Bank name" value={supplier.bankDetails.bankName} />
                )}
                {supplier.bankDetails?.accountNumber && (
                  <InfoRow label="Account number" value={supplier.bankDetails.accountNumber} />
                )}
                {supplier.bankDetails?.ifscCode && (
                  <InfoRow label="IFSC code" value={supplier.bankDetails.ifscCode} />
                )}
                {supplier.bankDetails?.upiId && (
                  <InfoRow label="UPI ID" value={supplier.bankDetails.upiId} />
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--muted)]">No bank details provided.</p>
            )}
          </div>
        </section>
      </div>

      {/* Purchase History */}
      <section className="surface-card p-6 sm:p-8">
        <SectionTitle eyebrow="History">Purchase history</SectionTitle>
        <div className="mt-4">
          {purchasesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-12 w-full" />
              ))}
            </div>
          ) : totalPurchases === 0 ? (
            <p className="text-sm text-[var(--muted)]">No purchases found for this supplier.</p>
          ) : (
            <div className="space-y-3">
              {Array.isArray(purchases) && purchases.slice(0, 10).map((purchase: unknown) => {
                const item = purchase as Record<string, unknown>;
                return (
                  <div key={String(item._id)} className="flex items-center justify-between rounded-lg border border-[var(--border-soft)] bg-white/70 p-4">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {String(item.purchaseOrderNumber ?? '—')}
                      </p>
                      <p className="text-xs text-[var(--muted-soft)]">
                        {item.purchaseDate ? new Date(String(item.purchaseDate)).toLocaleDateString('en-IN') : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold text-[var(--foreground)]">
                        {item.grandTotal ? formatINR(Number(item.grandTotal)) : '—'}
                      </p>
                      <p className="text-xs text-[var(--muted-soft)]">{String(item.status ?? '—')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
