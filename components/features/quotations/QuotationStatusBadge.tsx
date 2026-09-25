import type { QuotationStatus } from '@/types/quotation';

/** Mirrors the backend Quotation status enum. */
const STATUS_LABEL: Record<QuotationStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-[var(--surface-muted)] text-[var(--muted)]' },
  sent: { label: 'Sent', className: 'bg-[var(--primary-tint)] text-[var(--foreground)]' },
  accepted: { label: 'Accepted', className: 'badge-success' },
  rejected: { label: 'Rejected', className: 'bg-[var(--surface-muted)] text-[var(--error)]' },
  expired: { label: 'Expired', className: 'bg-[var(--surface-muted)] text-[var(--muted)]' },
  converted: { label: 'Converted', className: 'badge-warning' },
};

export function QuotationStatusBadge({
  status,
  className = '',
}: {
  status?: QuotationStatus | null;
  className?: string;
}) {
  const entry = STATUS_LABEL[(status ?? 'draft') as QuotationStatus] ?? STATUS_LABEL.draft;

  return <span className={`badge-pill ${entry.className} ${className}`.trim()}>{entry.label}</span>;
}

export const QUOTATION_STATUS_OPTIONS: Array<{ value: QuotationStatus; label: string }> = (
  Object.keys(STATUS_LABEL) as QuotationStatus[]
).map((value) => ({ value, label: STATUS_LABEL[value].label }));

export default QuotationStatusBadge;
