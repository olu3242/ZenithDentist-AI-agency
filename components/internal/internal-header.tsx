export function InternalHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header>
      <p className="text-xs font-black uppercase tracking-wider text-gold">Zenith internal control center</p>
      <h1 className="mt-2 text-4xl font-black">{title}</h1>
      <p className="mt-2 max-w-3xl text-muted">{subtitle}</p>
    </header>
  );
}
