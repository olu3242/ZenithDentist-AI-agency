import { EnterpriseCommandCenter } from "@/components/enterprise/enterprise-command-center";
import { EnterpriseHealthRadar } from "@/components/enterprise/enterprise-health-radar";
import { EnterpriseTimeline } from "@/components/enterprise/enterprise-timeline";
import { PortalHeader } from "@/components/portal/portal-header";
import { getEnterpriseCloudState, getRevenueOrchestrationState } from "@/lib/enterprise-cloud";

export default async function PortalCloudPage() {
  const [state, revenue] = await Promise.all([getEnterpriseCloudState(), getRevenueOrchestrationState()]);
  return (
    <div className="space-y-6">
      <PortalHeader title="Healthcare Operations Cloud" subtitle="Enterprise operational intelligence, revenue recovery, governance, and predictive coordination." />
      <EnterpriseCommandCenter state={state} revenue={revenue} />
      <EnterpriseHealthRadar state={state} />
      <EnterpriseTimeline state={state} />
    </div>
  );
}
