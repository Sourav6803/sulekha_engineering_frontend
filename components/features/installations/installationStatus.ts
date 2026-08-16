import type { InstallationStatus } from '@/types/installation';

export interface StatusStyle {
  label: string;
  className: string;
}

export const INSTALLATION_STATUS: Record<InstallationStatus, StatusStyle> = {
  pending_quotation: { label: 'Pending quotation', className: 'badge-warning' },
  quoted: { label: 'Quoted', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  scheduled: { label: 'Scheduled', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  in_progress: { label: 'In progress', className: 'badge-warning' },
  completed: { label: 'Completed', className: 'badge-success' },
  cancelled: { label: 'Cancelled', className: 'badge-error' },
};

export const ROOF_TYPE_LABEL: Record<string, string> = {
  rcc_rooftop: 'RCC Rooftop',
  tin_shed: 'Tin Shed',
  ground_mount: 'Ground Mount',
};

export function installationStatusStyle(status?: InstallationStatus): StatusStyle {
  return INSTALLATION_STATUS[status ?? 'pending_quotation'] ?? INSTALLATION_STATUS.pending_quotation;
}