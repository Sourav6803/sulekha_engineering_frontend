import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  /** Inline (in-flow) vs centered full-area layout. */
  variant?: 'inline' | 'block';
}

export function LoadingSpinner({ label = 'Loading…', variant = 'block' }: LoadingSpinnerProps) {
  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
        {label}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Loader2 className="h-7 w-7 animate-spin text-[var(--primary)]" />
      <p className="text-sm text-[var(--muted)]">{label}</p>
    </div>
  );
}
