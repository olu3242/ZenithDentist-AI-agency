import { MetricCard } from "@/components/metric-card";
import { PlanComparison } from "@/components/tenant/plan-comparison";
import { UsageMeter } from "@/components/tenant/usage-meter";
import { InternalHeader } from "@/components/internal/internal-header";
import { getInternalPlatformData } from "@/lib/data/internal";
import { formatCurrency } from "@/lib/utils";

export default async function InternalRevenuePage() {
  const { tenantData, mrr, funnelPerformance } = await getInternalPlatformData();
  const activePlan = tenantData.plans.find(plan => plan.plan_key === tenantData.organization.active_plan);
  return (
    <div className="space-y-6">
      <InternalHeader title="Revenue Operations" subtitle="MRR, subscription plan readiness, usage expansion, and upgrade paths." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="MRR" value={formatCurrency(mrr)} detail="Current active subscription value" tone="green" />
        <MetricCard label="Funnel performance" value={`${funnelPerformance}%`} detail="Lead to audit conversion" tone="teal" />
        <MetricCard label="Upgrade path" value="Growth" detail="Stripe Billing + Checkout ready" tone="gold" />
      </div>
      <UsageMeter usage={tenantData.usage[0]} plan={activePlan} />
      <PlanComparison plans={tenantData.plans} activePlan={tenantData.organization.active_plan} />
    </div>
  );
}
