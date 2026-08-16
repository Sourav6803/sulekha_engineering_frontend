import type { CustomerStatus } from '@/types/customer';

export interface StatusStyle {
  label: string;
  className: string;
}

/**
 * Display label + badge classes for each customer status.
 * `badge-pill` is the shared base; the tint/color classes come from
 * app/globals.css (badge-success / badge-error / badge-warning).
 */
export const CUSTOMER_STATUS: Record<CustomerStatus, StatusStyle> = {
  active: { label: 'Active', className: 'badge-success' },
  inactive: { label: 'Inactive', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  blocked: { label: 'Blocked', className: 'badge-error' },
  pending_verification: { label: 'Pending verification', className: 'badge-warning' },
};

export const ROOF_TYPE_LABEL: Record<string, string> = {
  rcc_rooftop: 'RCC Rooftop',
  tin_shed: 'Tin Shed',
  ground_mount: 'Ground Mount',
};

export const TIME_SLOT_LABEL: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  anytime: 'Anytime',
};

export function customerStatusStyle(status?: CustomerStatus): StatusStyle {
  return CUSTOMER_STATUS[status ?? 'active'] ?? CUSTOMER_STATUS.active;
}
