import { OrchestrationTimeline } from "@/components/mission-control/orchestration-timeline";
import type { MissionControlState } from "@/lib/stability";

export function OrchestrationDependencyGraph({ state }: { state: MissionControlState }) {
  return <OrchestrationTimeline state={state} />;
}
