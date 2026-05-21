import { buildAuditRecommendations, calculateRevenueProjection } from "@/lib/roi";
import type { RoiInput } from "@/lib/validation";
import { formatCurrency } from "@/lib/utils";

export function AuditGenerator({ input }: { input: RoiInput }) {
  const projection = calculateRevenueProjection(input);
  const recommendations = buildAuditRecommendations(input, projection);

  return (
    <article className="rounded border border-line bg-white p-6">
      <p className="text-xs font-black uppercase tracking-wider text-teal">Audit generator</p>
      <h2 className="mt-3 text-2xl font-black">Executive recovery summary</h2>
      <p className="mt-3 text-muted">
        Estimated monthly leakage is {formatCurrency(projection.monthlyRevenueLoss)} with a recoverable opportunity of{" "}
        {formatCurrency(projection.recoverableRevenue)}.
      </p>
      <div className="mt-5 grid gap-3">
        {recommendations.map(item => (
          <div key={item.title} className="rounded bg-paper p-4">
            <strong>{item.title}</strong>
            <p className="mt-1 text-sm text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
