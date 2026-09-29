'use client';

import { KeyRound, Power, Trash2, UserCog } from 'lucide-react';
import { DataTable, type SortOrder } from '@/components/shared/DataTable';
import { agentStatusStyle } from './agentStatus';
import { formatDateTime } from '@/lib/format';
import type { AgentListItem } from '@/types/agent';

interface AgentTableProps {
  agents: AgentListItem[];
  loading?: boolean;
  /** Id of the agent whose row action is in flight. */
  busyId?: string | null;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (key: string, order: SortOrder) => void;
  onSuspend?: (agent: AgentListItem) => void;
  onReactivate?: (agent: AgentListItem) => void;
  onResetPassword?: (agent: AgentListItem) => void;
  onDelete?: (agent: AgentListItem) => void;
  emptyAction?: React.ReactNode;
}

const compactAction =
  'inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40';

/** One "label value" pair inside the compact work strip. */
function WorkStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="whitespace-nowrap text-[11px] text-[var(--muted)]">
      {label} <span className="font-semibold tabular-nums text-[var(--foreground)]">{value}</span>
    </span>
  );
}

/** The admin's agent roster, with what each agent has actually brought in. */
export function AgentTable({
  agents,
  loading = false,
  busyId = null,
  sortBy,
  sortOrder,
  onSort,
  onSuspend,
  onReactivate,
  onResetPassword,
  onDelete,
  emptyAction,
}: AgentTableProps) {
  const suspended = (agent: AgentListItem) => agent.status === 'suspended' || agent.status === 'blocked';

  return (
    <DataTable<AgentListItem>
      columns={[
        {
          key: 'name',
          header: 'Agent',
          sortable: true,
          render: (agent) => (
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary-tint)] text-[var(--primary-active)]">
                <UserCog className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="max-w-[13rem] truncate font-semibold text-[var(--foreground)]">{agent.name}</p>
                <p className="max-w-[13rem] truncate text-xs text-[var(--muted)]">{agent.email}</p>
                {agent.mustChangePassword && (
                  <span className="badge-pill mt-1 bg-[var(--warning-tint)] text-[var(--warning)]">
                    First login pending
                  </span>
                )}
              </div>
            </div>
          ),
        },
        {
          key: 'phone',
          header: 'Contact',
          hideOnMobile: true,
          render: (agent) => (
            <div className="min-w-0">
              <p className="whitespace-nowrap font-mono text-sm tabular-nums text-[var(--foreground)]">
                {agent.phone || '—'}
              </p>
              <p className="max-w-[10rem] truncate text-xs text-[var(--muted)]">
                {agent.employeeId ? `ID ${agent.employeeId}` : 'No employee ID'}
              </p>
            </div>
          ),
        },
        {
          key: 'work',
          header: 'Work',
          render: (agent) => (
            <div className="flex max-w-[16rem] flex-wrap gap-x-3 gap-y-0.5">
              <WorkStat label="Consumers" value={agent.stats?.consumers ?? 0} />
              <WorkStat label="Apps" value={agent.stats?.applications ?? 0} />
              <WorkStat label="Quotations" value={agent.stats?.quotations ?? 0} />
              <WorkStat label="Agreements" value={agent.stats?.agreements ?? 0} />
              <WorkStat label="Pending" value={agent.stats?.pendingReview ?? 0} />
            </div>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          render: (agent) => {
            const status = agentStatusStyle(agent.status);
            return (
              <div className="min-w-0">
                <span className={`badge-pill ${status.className}`}>{status.label}</span>
                <p className="mt-1 max-w-[9rem] truncate text-xs text-[var(--muted)]">
                  {agent.department || '—'}
                </p>
              </div>
            );
          },
        },
        {
          key: 'lastLogin',
          header: 'Last login',
          sortable: true,
          hideOnMobile: true,
          render: (agent) => (
            <span className="whitespace-nowrap text-sm text-[var(--muted)]">
              {agent.lastLogin ? formatDateTime(agent.lastLogin) : 'Never'}
            </span>
          ),
        },
        {
          key: 'actions',
          header: '',
          className: 'text-right',
          render: (agent) => {
            const isBusy = busyId === agent.id;
            return (
              <div className="flex items-center justify-end gap-1">
                {suspended(agent) ? (
                  <button
                    type="button"
                    className={compactAction}
                    title="Reactivate"
                    aria-label={`Reactivate ${agent.name}`}
                    disabled={isBusy}
                    onClick={() => onReactivate?.(agent)}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={compactAction}
                    title="Suspend"
                    aria-label={`Suspend ${agent.name}`}
                    disabled={isBusy}
                    onClick={() => onSuspend?.(agent)}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  className={compactAction}
                  title="Reset password"
                  aria-label={`Reset the password for ${agent.name}`}
                  disabled={isBusy}
                  onClick={() => onResetPassword?.(agent)}
                >
                  <KeyRound className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`${compactAction} hover:text-[var(--error)]`}
                  title="Delete"
                  aria-label={`Delete ${agent.name}`}
                  disabled={isBusy}
                  onClick={() => onDelete?.(agent)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          },
        },
      ]}
      data={agents}
      keyField="id"
      rowId={(agent) => agent.id}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      emptyState={{
        icon: UserCog,
        title: 'No agents yet',
        description: 'Create an agent account and the credentials are emailed automatically.',
        action: emptyAction,
      }}
    />
  );
}

export default AgentTable;
