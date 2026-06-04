import type { Recommendation } from "@/lib/data/operations";

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const confidence = recommendation.priority === "critical" || recommendation.priority === "high" ? 88 : 82;
  const traceId = `alice-${recommendation.id}`;
  return (
    <article className="rounded border border-card bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-accent">{recommendation.priority} priority</p>
          <h3 className="mt-2 text-lg font-black">{recommendation.title}</h3>
        </div>
        <span className="rounded-full bg-background px-3 py-1 text-xs font-black capitalize">{recommendation.status}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{recommendation.recommendation}</p>
      <div className="mt-4 rounded bg-green/10 p-3 text-sm font-bold text-green">{recommendation.expected_impact}</div>
      <div className="mt-4 grid gap-3 rounded border border-line bg-paper p-4 text-sm">
        <EvidenceRow label="Problem" value={recommendation.title} />
        <EvidenceRow label="Impact" value={recommendation.expected_impact} />
        <EvidenceRow label="Evidence" value={`Priority ${recommendation.priority}; status ${recommendation.status}; tenant recommendation record ${recommendation.id}.`} />
        <EvidenceRow label="Confidence" value={`${confidence}%`} />
        <EvidenceRow label="Recommended Action" value={recommendation.recommendation} />
        <EvidenceRow label="Expected Outcome" value={recommendation.expected_impact} />
        <EvidenceRow label="Trace ID" value={traceId} />
      </div>
    </article>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs font-black uppercase tracking-wider text-muted">{label}</span>
      <strong className="mt-1 block font-semibold text-ink">{value}</strong>
    </div>
  );
}
