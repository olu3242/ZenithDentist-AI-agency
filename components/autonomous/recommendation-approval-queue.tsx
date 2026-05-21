export function RecommendationApprovalQueue({
  approvals
}: {
  approvals: Array<{ id: string; title: string; summary: string; status: string; confidence: number }>;
}) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Recommendation Approval Queue</h2>
      <p className="text-sm text-muted">Every autonomous recommendation waits for operator review before implementation.</p>
      <div className="mt-5 grid gap-3">
        {approvals.map(item => (
          <article key={item.id} className="rounded border border-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <strong>{item.title}</strong>
                <p className="mt-1 text-sm text-muted">{item.summary}</p>
              </div>
              <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-black text-gold">{item.status}</span>
            </div>
            <small className="mt-3 block font-bold text-teal">{Math.round(item.confidence * 100)}% recommendation confidence</small>
          </article>
        ))}
      </div>
    </section>
  );
}
