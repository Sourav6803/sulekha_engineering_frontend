// import Link from "next/link";

// export default function NotFound() {
//   return (
//     <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
//       <div className="surface-card w-full max-w-2xl p-8">
//         <div className="rounded-[1.25rem] bg-[var(--surface)] p-6">
//           <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
//             Page not found
//           </p>
//           <h1 className="mt-4 text-3xl font-semibold leading-tight">
//             We could not find that page.
//           </h1>
//           <p className="mt-3 text-base leading-7 text-[var(--muted)]">
//             The route you are looking for does not exist, or it may have been moved. Use the buttons below to continue.
//           </p>
//         </div>

//         <div className="mt-8 grid gap-4 sm:grid-cols-2">
//           <Link href="/login" className="brand-button text-center w-full">
//             Return to login
//           </Link>
//           <Link href="/" className="neutral-button text-center w-full">
//             Back to home
//           </Link>
//         </div>
//       </div>
//     </main>
//   );
// }



import Link from "next/link";
import type { SVGProps } from "react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="surface-card w-full max-w-2xl overflow-hidden p-0">
        <div className="surface-sunrise flex flex-col items-start gap-4 p-8 sm:p-10">
          <div className="flex w-full items-start justify-between gap-4">
            <CompassIcon className="h-10 w-10 text-white/90" />
            <span className="font-display text-5xl font-semibold leading-none text-white/25 sm:text-6xl">
              404
            </span>
          </div>
          <div>
            <span className="badge-pill bg-white/15 text-white">Page not found</span>
            <h1 className="font-display mt-4 text-3xl leading-tight text-white sm:text-4xl">
              We couldn&apos;t find that page
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
              The page you&apos;re looking for doesn&apos;t exist, or it may have moved.
              Head back to login or your dashboard to continue.
            </p>
          </div>
        </div>

        <hr className="hairline-sunrise" />

        <div className="p-8 sm:p-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard" className="brand-button w-full text-center">
              Back to dashboard
            </Link>
            <Link href="/login" className="neutral-button w-full text-center">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function CompassIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.2 13 13l-3.8 1.8L11 11l3.8-1.8Z" />
    </svg>
  );
}