import { AIConfidenceMatrix } from "@/components/mission-control/ai-confidence-matrix";
import { ForecastDriftRadar } from "@/components/mission-control/forecast-drift-radar";
import { ImplementationCommandCenter } from "@/components/mission-control/implementation-command-center";
import { MissionControlCenter } from "@/components/mission-control/mission-control-center";
import { OpenDentalPilotPanel } from "@/components/mission-control/open-dental-pilot-panel";
import { QueueHealthPanel } from "@/components/mission-control/queue-health-panel";
import { ReplayConsole } from "@/components/mission-control/replay-console";
import { InternalHeader } from "@/components/internal/internal-header";
import { getImplementationIntelligenceState } from "@/lib/implementation-intelligence";
import { getMissionControlState } from "@/lib/stability";

export default async function MissionControlPage() {
  const [state, implementationIntelligence] = await Promise.all([
    getMissionControlState(),
    getImplementationIntelligenceState()
  ]);
  return (
    <div className="space-y-6">
      <InternalHeader title="Executive Dashboard" subtitle="Operational stability, queue health, AI grounding, replay controls, and Open Dental pilot visibility." />
      <MissionControlCenter state={state} />
      <ImplementationCommandCenter state={implementationIntelligence} />
      <OpenDentalPilotPanel state={state} />
      <QueueHealthPanel state={state} />
      <div className="grid gap-6 xl:grid-cols-2">
        <ReplayConsole state={state} />
        <ForecastDriftRadar state={state} />
      </div>
      <AIConfidenceMatrix state={state} />
    </div>
  );
}
