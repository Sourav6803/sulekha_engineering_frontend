import type { ComponentType } from 'react';

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Friendly empty state shown when a list or panel has nothing to display. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      {Icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--secondary)]">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
        {description && <p className="mx-auto max-w-sm text-sm leading-6 text-[var(--muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
