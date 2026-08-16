"use client";

import Link from "next/link";

interface DashboardErrorProps {
  error: Error;
  reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="surface-card max-w-3xl space-y-8 p-8">
        <div className="rounded-[1.25rem] bg-[var(--surface)] p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
            Dashboard error
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">
            We couldn’t load this section of the dashboard.
          </h1>
          <p className="mt-2 text-base leading-7 text-[var(--muted)]">
            Something stopped the dashboard from rendering. You can retry or return to the home screen.
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-[var(--border)] bg-white p-6">
          <p className="text-sm text-[var(--muted)]">Error details:</p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground)]">
            {error.message}
          </pre>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => reset()}
            className="brand-button w-full sm:w-auto"
          >
            Retry dashboard
          </button>
          <Link href="/" className="neutral-button w-full text-center sm:w-auto">
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}

