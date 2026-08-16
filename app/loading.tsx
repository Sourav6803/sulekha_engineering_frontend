// export default function Loading() {
//   return (
//     <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
//       <div className="surface-card w-full max-w-xl animate-[pulse_1.5s_ease-in-out_infinite] p-8">
//         <div className="h-4 w-40 rounded-full bg-[var(--surface-muted)]" />
//         <div className="mt-6 space-y-4">
//           <div className="h-4 w-full rounded-full bg-[var(--surface-muted)]" />
//           <div className="h-4 w-5/6 rounded-full bg-[var(--surface-muted)]" />
//         </div>
//         <div className="mt-8 grid gap-4 sm:grid-cols-2">
//           <div className="h-28 rounded-[var(--radius-sm)] bg-[var(--surface-muted)]" />
//           <div className="h-28 rounded-[var(--radius-sm)] bg-[var(--surface-muted)]" />
//         </div>
//       </div>
//     </main>
//   );
// }




import type { SVGProps } from "react";

/**
 * Shown by Next.js automatically for any route segment/page that
 * suspends (navigation, data fetching). Keep this fast and
 * dependency-free — no client state, no "use client" needed.
 *
 * Two loading cues layered together, matching how this gets used
 * across the app:
 *  1. `.route-progress` — a slim top bar for page-switch navigation.
 *  2. Branded mark + shimmering skeleton — for the "waiting on data"
 *     feel once you're already on a page.
 */
export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]"
    >
      <div className="route-progress" aria-hidden="true" />
      <span className="sr-only">Loading, please wait</span>

      <div className="mb-8 flex flex-col items-center gap-3" aria-hidden="true">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full opacity-30 blur-md"
            style={{ background: "var(--gradient-sunrise)" }}
          />
          <SunMark className="animate-spin-slow relative h-14 w-14 text-[var(--primary)]" />
        </div>
        <div className="text-center">
          <p className="font-display text-lg font-semibold leading-tight">Sulekha Engineering</p>
          <p className="mt-1 text-xs uppercase text-[var(--muted)]" style={{ letterSpacing: "var(--tracking-wide)" }}>
            Loading your data
          </p>
        </div>
      </div>

      <div className="surface-card w-full max-w-xl p-8" aria-hidden="true">
        <div className="skeleton h-4 w-40" />
        <div className="mt-6 space-y-3">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
        </div>
        <div className="mt-6 space-y-3">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-4/5" />
        </div>
      </div>
    </main>
  );
}

function SunMark(props: SVGProps<SVGSVGElement>) {
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
      <path d="M12 1.5v3M12 19.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M1.5 12h3M19.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" />
    </svg>
  );
}