

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SVGProps } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Always log — digest is what you'd search server logs for.
    console.error("[AppError]", error.message, error.digest ? `digest: ${error.digest}` : "");
  }, [error]);

  const handleCopy = async () => {
    const details = [error.message, error.digest ? `Ref: ${error.digest}` : null]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (older browser/permissions) — fail silently,
      // the copy button just won't confirm. Not worth its own error state.
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <div className="surface-card w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 overflow-hidden p-0 duration-300">
        <div className="surface-sunrise flex flex-col items-start gap-4 p-8 sm:p-10">
          <SunIcon className="h-10 w-10 text-white/90" />
          <div>
            <span className="badge-pill bg-white/15 text-white">Section unavailable</span>
            <h1 className="font-display mt-4 text-3xl leading-tight text-white sm:text-4xl">
              We couldn&apos;t load this section
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
              Something went wrong while rendering this page. Your data is safe —
              try again, or head back to the dashboard.
            </p>
          </div>
        </div>

        <hr className="hairline-sunrise" />

        <div className="space-y-6 p-8 sm:p-10">
          <div className="rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]" style={{ letterSpacing: "var(--tracking-wide)" }}>
                Error details
              </p>
              <button type="button" onClick={handleCopy} className="ghost-button !px-3 !py-1.5 text-xs">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="font-mono mt-3 overflow-x-auto whitespace-pre-wrap break-words text-sm text-[var(--foreground)]">
              {error.message}
            </pre>
            {error.digest && (
              <p className="font-mono mt-2 text-xs text-[var(--muted-soft)]">Ref: {error.digest}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={() => reset()} className="brand-button w-full sm:w-auto">
              Try again
            </button>
            <Link href="/dashboard" className="neutral-button w-full text-center sm:w-auto">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" />
    </svg>
  );
}