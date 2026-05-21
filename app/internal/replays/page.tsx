import { ReplayConsole } from "@/components/mission-control/replay-console";
import { InternalHeader } from "@/components/internal/internal-header";
import { getMissionControlState } from "@/lib/stability";

export default async function InternalReplaysPage() {
  const state = await getMissionControlState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Operational Replays" subtitle="Replay failed events, intelligence generation, orchestration sequences, and forecasting jobs with audit visibility." />
      <ReplayConsole state={state} />
    </div>
  );
}
