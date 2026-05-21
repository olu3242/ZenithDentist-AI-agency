export function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-paper p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-12 w-80 animate-pulse rounded bg-line" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map(item => <div key={item} className="h-32 animate-pulse rounded bg-white" />)}
        </div>
        <div className="h-96 animate-pulse rounded bg-white" />
      </div>
    </main>
  );
}
