import type { Recommendation } from "@/lib/data/operations";

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  return (
    <article className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-teal">{recommendation.priority} priority</p>
          <h3 className="mt-2 text-lg font-black">{recommendation.title}</h3>
        </div>
        <span className="rounded-full bg-paper px-3 py-1 text-xs font-black capitalize">{recommendation.status}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{recommendation.recommendation}</p>
      <div className="mt-4 rounded bg-green/10 p-3 text-sm font-bold text-green">{recommendation.expected_impact}</div>
    </article>
  );
}
