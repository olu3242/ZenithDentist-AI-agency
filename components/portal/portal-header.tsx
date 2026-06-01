export function PortalHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <p className="brand-kicker">Zenith PROS client intelligence portal</p>
        <h1 className="mt-2 text-4xl font-black">{title}</h1>
        <p className="mt-2 max-w-3xl text-muted">{subtitle}</p>
      </div>
      <div className="brand-panel rounded px-4 py-3 text-sm font-bold text-muted">
        Live operations view
      </div>
    </header>
  );
}
