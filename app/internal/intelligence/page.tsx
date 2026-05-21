import { IntelligenceBenchmarkBoard } from "@/components/mission-control/intelligence-benchmark-board";
import { IntelligenceRunViewer } from "@/components/mission-control/intelligence-run-viewer";
import { InternalHeader } from "@/components/internal/internal-header";
import { getMissionControlState } from "@/lib/stability";

export default async function InternalIntelligencePage() {
  const state = await getMissionControlState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Intelligence Quality" subtitle="Recommendation success, forecast quality, benchmark precision, and operational relevance scoring." />
      <IntelligenceBenchmarkBoard state={state} />
      <IntelligenceRunViewer state={state} />
    </div>
  );
}
