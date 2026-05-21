import { AIConfidenceMatrix } from "@/components/mission-control/ai-confidence-matrix";
import { ForecastDriftRadar } from "@/components/mission-control/forecast-drift-radar";
import { MissionControlCenter } from "@/components/mission-control/mission-control-center";
import { OpenDentalPilotPanel } from "@/components/mission-control/open-dental-pilot-panel";
import { QueueHealthPanel } from "@/components/mission-control/queue-health-panel";
import { ReplayConsole } from "@/components/mission-control/replay-console";
import { InternalHeader } from "@/components/internal/internal-header";
import { getMissionControlState } from "@/lib/stability";

export default async function MissionControlPage() {
  const state = await getMissionControlState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Mission Control" subtitle="Operational stability, queue health, AI grounding, replay controls, and Open Dental pilot visibility." />
      <MissionControlCenter state={state} />
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
