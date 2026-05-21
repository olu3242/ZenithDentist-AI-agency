import { AliceRuntimeRecommendations } from "@/components/mission-control/alice-runtime-recommendations";
import { DeadLetterExplorer } from "@/components/mission-control/dead-letter-explorer";
import { RuntimeHealthDashboard } from "@/components/mission-control/runtime-health-dashboard";
import { RuntimeTraceViewer } from "@/components/mission-control/runtime-trace-viewer";
import { SlaBreachPanel } from "@/components/mission-control/sla-breach-panel";
import { InternalHeader } from "@/components/internal/internal-header";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";

export default async function InternalRuntimeHealthPage() {
  const state = await getRuntimeHealthState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Runtime Health" subtitle="Live trace observability, SLA breaches, dead letters, replay readiness, and ALICE remediation intelligence." />
      <RuntimeHealthDashboard state={state} />
      <AliceRuntimeRecommendations state={state} />
      <div className="grid gap-6 xl:grid-cols-2">
        <DeadLetterExplorer state={state} />
        <SlaBreachPanel state={state} />
      </div>
      <RuntimeTraceViewer state={state} />
    </div>
  );
}
