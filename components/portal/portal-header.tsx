export function PortalHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex min-w-0 flex-col justify-between gap-4 rounded border border-line bg-white p-5 shadow-sm lg:flex-row lg:items-end">
      <div className="min-w-0">
        <p className="brand-kicker">Zenith Pros client intelligence portal</p>
        <h1 className="mt-2 text-2xl font-black text-ink md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold text-muted md:text-base">{subtitle}</p>
      </div>
      <div className="shrink-0 rounded border border-line bg-paper px-4 py-3 text-sm font-bold text-muted">
        Live operations view
      </div>
    </header>
  );
}
