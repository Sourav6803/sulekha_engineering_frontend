import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  /** Optional header block rendered above children (title, actions, filters). */
  header?: ReactNode;
  className?: string;
}

/**
 * Standard page wrapper for dashboard views — consistent max-width,
 * vertical rhythm, and optional page header.
 */
export function PageContainer({ children, header, className = '' }: PageContainerProps) {
  return (
    <main className={`min-h-screen bg-[var(--background)] px-4 py-10 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-7xl space-y-8">
        {header && <div>{header}</div>}
        {children}
      </div>
    </main>
  );
}
