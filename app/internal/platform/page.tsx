import { ExecutiveCommandCenter } from "@/components/autonomous/executive-command-center";
import { PracticeHealthRadar } from "@/components/autonomous/practice-health-radar";
import { InternalHeader } from "@/components/internal/internal-header";
import { getAutonomousEngineState } from "@/lib/autonomous";

export default async function InternalPlatformPage() {
  const state = await getAutonomousEngineState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Autonomous Platform Control" subtitle="High-level operating posture, AI confidence, benchmark leadership, and risk indicators across the dental OS." />
      <ExecutiveCommandCenter state={state} />
      <PracticeHealthRadar score={state.health} />
    </div>
  );
}
