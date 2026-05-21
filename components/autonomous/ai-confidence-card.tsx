export function AIConfidenceCard({ confidence }: { confidence: number }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-teal">ALICE confidence</p>
      <strong className="mt-3 block text-5xl font-black text-ink">{confidence}%</strong>
      <p className="mt-2 text-sm text-muted">Composite reliability across predictions, recommendations, and operating signals.</p>
    </section>
  );
}
