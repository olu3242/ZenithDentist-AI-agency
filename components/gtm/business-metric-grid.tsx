import { MetricCard } from "@/components/metric-card";
import type { getBusinessGrowthState } from "@/lib/gtm/business-growth";

type BusinessGrowthState = Awaited<ReturnType<typeof getBusinessGrowthState>>;

export function BusinessMetricGrid({ state }: { state: BusinessGrowthState }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="MRR" value={`$${state.metrics.mrr.toLocaleString()}`} detail="Closed client run-rate" tone="teal" />
      <MetricCard label="Pipeline value" value={`$${Math.round(state.metrics.pipelineValue).toLocaleString()}`} detail="Recoverable revenue opportunity" tone="green" />
      <MetricCard label="Discovery bookings" value={state.metrics.discoveryBookings} detail="Booked call activity" tone="blue" />
      <MetricCard label="Close rate" value={`${state.metrics.closeRate}%`} detail="Won over total leads" tone="gold" />
      <MetricCard label="ARR" value={`$${state.metrics.arr.toLocaleString()}`} detail="Annual recurring run-rate" tone="teal" />
      <MetricCard label="Avg implementation" value={`$${state.metrics.avgImplementationValue.toLocaleString()}`} detail="Average opportunity size" tone="rust" />
      <MetricCard label="Client health" value={`${state.metrics.clientHealth}%`} detail="Operational success score" tone="green" />
      <MetricCard label="Referrals" value={state.metrics.referralOpportunities} detail="Advocacy opportunities" tone="blue" />
      <MetricCard label="Case studies" value={state.metrics.caseStudyCandidates} detail="Proof assets in progress" tone="gold" />
      <MetricCard label="Content assets" value={state.metrics.contentAssets} detail="Authority engine inventory" tone="teal" />
    </div>
  );
}
