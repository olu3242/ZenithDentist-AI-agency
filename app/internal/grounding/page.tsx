import { AIConfidenceMatrix } from "@/components/mission-control/ai-confidence-matrix";
import { IntelligenceRunViewer } from "@/components/mission-control/intelligence-run-viewer";
import { InternalHeader } from "@/components/internal/internal-header";
import { getMissionControlState } from "@/lib/stability";

export default async function InternalGroundingPage() {
  const state = await getMissionControlState();
  return (
    <div className="space-y-6">
      <InternalHeader title="AI Grounding" subtitle="Operational metrics, benchmark history, recommendation history, scheduling patterns, retention outcomes, and memory validation." />
      <AIConfidenceMatrix state={state} />
      <IntelligenceRunViewer state={state} />
    </div>
  );
}
