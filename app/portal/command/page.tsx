import { ExecutiveCommandCenter } from "@/components/autonomous/executive-command-center";
import { OperationalTimeline } from "@/components/autonomous/operational-timeline";
import { PracticeHealthRadar } from "@/components/autonomous/practice-health-radar";
import { PortalHeader } from "@/components/portal/portal-header";
import { getAutonomousEngineState } from "@/lib/autonomous";

export default async function PortalCommandPage() {
  const state = await getAutonomousEngineState();
  return (
    <div className="space-y-6">
      <PortalHeader title="Executive Command Center" subtitle="Practice health, AI confidence, risk indicators, benchmark leadership, and operational trajectory." />
      <ExecutiveCommandCenter state={state} />
      <PracticeHealthRadar score={state.health} />
      <OperationalTimeline events={state.timeline} />
    </div>
  );
}
