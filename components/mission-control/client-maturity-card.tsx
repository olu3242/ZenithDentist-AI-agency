export function ClientMaturityCard({ title, score, detail }: { title: string; score: number; detail: string }) {
  return (
    <div className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{title}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <strong className="text-4xl font-black text-ink">{score}%</strong>
        <span className={score >= 80 ? "text-xs font-black uppercase text-green" : score >= 55 ? "text-xs font-black uppercase text-gold" : "text-xs font-black uppercase text-rust"}>
          {score >= 80 ? "stable" : score >= 55 ? "watch" : "priority"}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-teal" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <p className="mt-3 text-sm font-semibold text-muted">{detail}</p>
    </div>
  );
}
