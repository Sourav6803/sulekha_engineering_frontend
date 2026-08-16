/** Route-transition skeleton for the Materials list page. */
export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-9 w-64" />
          <div className="skeleton h-4 w-96 max-w-full" />
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="surface-card h-32 p-6">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton mt-5 h-8 w-32" />
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="surface-card p-5">
          <div className="skeleton h-12 w-full" />
        </div>

        {/* Table rows */}
        <div className="surface-card space-y-4 p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      </div>
    </main>
  );
}
