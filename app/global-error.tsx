// "use client";

// import Link from "next/link";

// interface GlobalErrorProps {
//   error: Error;
//   reset?: () => void;
// }

// export default function GlobalError({ error, reset }: GlobalErrorProps) {
//   return (
//     <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
//       <div className="surface-card max-w-3xl space-y-8 p-8">
//         <div className="rounded-[1.25rem] bg-[var(--surface)] p-6 text-[var(--foreground)] shadow-sm">
//           <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
//             Service interrupted
//           </p>
//           <h1 className="mt-4 text-3xl font-semibold leading-tight">
//             Something prevented the app from loading.
//           </h1>
//           <p className="mt-2 text-base leading-7 text-[var(--muted)]">
//             The application has encountered an error that stopped rendering. Refresh or return to the login page to continue.
//           </p>
//         </div>

//         <div className="rounded-[1.25rem] border border-[var(--border)] bg-white p-6">
//           <p className="text-sm text-[var(--muted)]">Error details:</p>
//           <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground)]">
//             {error.message}
//           </pre>
//         </div>

//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
//           <button
//             type="button"
//             onClick={() => reset?.() ?? window.location.reload()}
//             className="brand-button w-full sm:w-auto"
//           >
//             Refresh app
//           </button>
//           <Link
//             href="/login"
//             className="neutral-button w-full text-center sm:w-auto"
//           >
//             Go to login
//           </Link>
//         </div>
//       </div>
//     </main>
//   );
// }






"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SVGProps } from "react";
// global-error replaces the ENTIRE document, including the root
// layout — so it must import the global stylesheet itself rather
// than relying on layout.tsx to have already loaded it.
import "./globals.css";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset?: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("[GlobalError]", error.message, error.digest ? `digest: ${error.digest}` : "");
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
      // Clipboard unavailable — copy button just won't confirm.
    }
  };

  return (
    // global-error MUST render its own <html>/<body> — Next.js
    // unmounts the root layout entirely when this boundary fires.
    <html lang="en">
      <body className="m-0 min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="surface-card w-full max-w-2xl overflow-hidden p-0">
            <div className="surface-sunrise flex flex-col items-start gap-4 p-8 sm:p-10">
              <PlugIcon className="h-10 w-10 text-white/90" />
              <div>
                <span className="badge-pill bg-white/15 text-white">Service interrupted</span>
                <h1 className="font-display mt-4 text-3xl leading-tight text-white sm:text-4xl">
                  Something prevented the app from loading
                </h1>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
                  The application hit an error it couldn&apos;t recover from on its own.
                  Refresh to try again, or go back to login.
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
                <button
                  type="button"
                  onClick={() => (reset ? reset() : window.location.reload())}
                  className="brand-button w-full sm:w-auto"
                >
                  Refresh app
                </button>
                <Link href="/login" className="neutral-button w-full text-center sm:w-auto">
                  Go to login
                </Link>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

function PlugIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M9 3v4M15 3v4M7 7h10v3a5 5 0 0 1-10 0V7Z" />
      <path d="M12 15v3M9 21h6" />
    </svg>
  );
}