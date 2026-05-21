import type { SubscriptionPlan } from "@/lib/data/tenants";
import { formatCurrency } from "@/lib/utils";

export function PlanComparison({ plans, activePlan }: { plans: SubscriptionPlan[]; activePlan: string }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {plans.map(plan => {
        const features = plan.features as string[];
        return (
          <article key={plan.id} className={`rounded border bg-white p-5 shadow-sm ${plan.plan_key === activePlan ? "border-teal" : "border-line"}`}>
            <p className="text-xs font-black uppercase tracking-wider text-muted">{plan.plan_key}</p>
            <h3 className="mt-2 text-2xl font-black">{plan.name}</h3>
            <strong className="mt-3 block text-3xl text-teal">{formatCurrency(plan.price_monthly)}<span className="text-sm text-muted">/mo</span></strong>
            <ul className="mt-5 grid gap-2 text-sm text-muted">
              {features.map(feature => <li key={feature}>{feature}</li>)}
            </ul>
          </article>
        );
      })}
    </section>
  );
}
