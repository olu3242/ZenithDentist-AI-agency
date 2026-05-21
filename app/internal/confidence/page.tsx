import { AIConfidenceMatrix } from "@/components/mission-control/ai-confidence-matrix";
import { AIConfidenceTimeline } from "@/components/mission-control/ai-confidence-timeline";
import { InternalHeader } from "@/components/internal/internal-header";
import { getMissionControlState } from "@/lib/stability";

export default async function InternalConfidencePage() {
  const state = await getMissionControlState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Confidence Calibration" subtitle="Recommendation confidence, forecast confidence, anomaly severity, and operational certainty monitoring." />
      <AIConfidenceMatrix state={state} />
      <AIConfidenceTimeline state={state} />
    </div>
  );
}
