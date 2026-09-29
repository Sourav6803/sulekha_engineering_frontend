import type { AgentStatus } from '@/types/agent';

export interface StatusStyle {
  label: string;
  className: string;
}

/**
 * Display label + badge classes for each agent account status.
 * `badge-pill` is the shared base; the tint/color classes come from
 * app/globals.css (badge-success / badge-error / badge-warning).
 */
export const AGENT_STATUS: Record<AgentStatus, StatusStyle> = {
  active: { label: 'Active', className: 'badge-success' },
  inactive: { label: 'Inactive', className: 'badge-pill bg-[var(--surface-muted)] text-[var(--muted)]' },
  suspended: { label: 'Suspended', className: 'badge-warning' },
  blocked: { label: 'Blocked', className: 'badge-error' },
};

export function agentStatusStyle(status?: AgentStatus): StatusStyle {
  return AGENT_STATUS[status ?? 'active'] ?? AGENT_STATUS.active;
}
