/** Route-transition skeleton for the Notifications page. */
export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="skeleton h-4 w-48" />
          <div className="skeleton h-9 w-64" />
          <div className="skeleton h-4 w-96 max-w-full" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-10 w-24 rounded-full" />
          ))}
        </div>

        {/* Notification cards */}
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="surface-card h-28 p-5">
              <div className="flex gap-4">
                <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
