import type { ComponentType } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  /** Optional icon rendered in a tinted chip. */
  icon?: ComponentType<{ className?: string }>;
  /** Tailwind text-color class for the value, e.g. "text-[var(--primary)]". */
  tone?: string;
  /** Optional one-line supporting hint under the value. */
  hint?: string;
}

/** Compact KPI card for dashboards / summary rows. */
export function StatCard({ label, value, icon: Icon, tone = 'text-[var(--foreground)]', hint }: StatCardProps) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--secondary)]">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className={`mt-4 text-3xl font-semibold tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="mt-2 text-xs text-[var(--muted-soft)]">{hint}</p>}
    </div>
  );
}
