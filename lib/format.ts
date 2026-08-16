/**
 * Formatting helpers shared across the UI. Kept dependency-free and
 * SSR-safe (they never touch `window`).
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrExactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-IN');

const compactFormatter = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Format a number as a whole INR amount: 1234567 -> "₹12,34,567" */
export function formatINR(value: number | undefined | null): string {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return inrFormatter.format(amount);
}

/** Format a number as INR with paise: 1234567.5 -> "₹12,34,567.50" */
export function formatINRExact(value: number | undefined | null): string {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return inrExactFormatter.format(amount);
}

/** Format a plain number with Indian digit grouping: 1234567 -> "12,34,567" */
export function formatNumber(value: number | undefined | null): string {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return numberFormatter.format(amount);
}

/** Compact number: 1234567 -> "1.2L" (Lakh), useful for dense stat cards. */
export function formatCompact(value: number | undefined | null): string {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return compactFormatter.format(amount);
}

/**
 * Format an ISO timestamp into a readable date. Falls back to the raw string
 * when the input is invalid so we never render "Invalid Date".
 */
export function formatDate(value: string | undefined | null, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const resolved = date.toLocaleDateString('en-IN', options ?? {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return resolved;
}

/** Format an ISO timestamp into a short relative-ish label: "11 Aug 2026" */
export function formatDateShort(value: string | undefined | null): string {
  return formatDate(value, { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Format an ISO timestamp into date + time: "11 Aug 2026, 4:05 PM" */
export function formatDateTime(value: string | undefined | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const datePart = formatDateShort(value);
  const timePart = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}
