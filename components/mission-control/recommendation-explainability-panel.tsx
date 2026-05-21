import { RecommendationAuditPanel } from "@/components/mission-control/recommendation-audit-panel";
import type { MissionControlState } from "@/lib/stability";

export function RecommendationExplainabilityPanel({ state }: { state: MissionControlState }) {
  return <RecommendationAuditPanel state={state} />;
}
