import Link from "next/link";

export default function SuppliersPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-[var(--border)] bg-white/95 p-8 shadow-[var(--shadow)]">
        <h1 className="text-3xl font-semibold">Suppliers</h1>
        <p className="mt-4 text-sm text-[var(--muted)]">
          Supplier records and purchase contact details will be visible here.
        </p>
        <Link href="/" className="brand-button mt-6 inline-flex">
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
