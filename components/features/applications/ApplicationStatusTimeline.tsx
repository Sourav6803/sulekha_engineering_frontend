'use client';

import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { formatDateTime } from '@/lib/format';
import type { ApplicationStatusHistoryEntry } from '@/types/application';
import type { ApplicationStatusMeta } from './applicationDisplay';

interface ApplicationStatusTimelineProps {
  entries?: ApplicationStatusHistoryEntry[];
  /** Label + tone per status, from /applications/checklist. */
  statusMeta: ApplicationStatusMeta;
}

/**
 * The application's status trail, oldest first. Each entry shows the status pill,
 * when it happened, who moved it and any note (a reviewer's remark or the reason
 * a correction was asked for).
 */
export function ApplicationStatusTimeline({ entries, statusMeta }: ApplicationStatusTimelineProps) {
  const history = entries ?? [];

  if (history.length === 0) {
    return <p className="text-xs leading-5 text-[var(--muted)]">No status changes recorded yet.</p>;
  }

  return (
    <ol className="relative space-y-4 pl-6">
      <span aria-hidden="true" className="absolute bottom-2 left-[7px] top-2 w-px bg-[var(--border)]" />
      {history.map((entry, index) => {
        const meta = statusMeta[entry.status];
        return (
          <li key={`${entry.status}-${entry.at ?? index}`} className="relative min-w-0">
            <span
              aria-hidden="true"
              className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-[var(--surface)] bg-[var(--primary)]"
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <ApplicationStatusBadge status={entry.status} label={meta?.label} tone={meta?.tone} />
              <span className="text-[11px] text-[var(--muted)]">{formatDateTime(entry.at)}</span>
            </div>
            {entry.byNameSnapshot && (
              <p className="mt-1 text-[11px] text-[var(--muted-soft)]">by {entry.byNameSnapshot}</p>
            )}
            {entry.note && (
              <p className="mt-1 text-xs leading-5 text-[var(--muted)] [overflow-wrap:anywhere]">{entry.note}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default ApplicationStatusTimeline;
