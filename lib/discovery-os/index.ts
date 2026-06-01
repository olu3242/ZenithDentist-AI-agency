import "server-only";

export type { PracticeAssessmentInput, DiscoverySession } from "@/lib/discovery-os/discovery-session";
export {
  createDiscoverySession,
  getDiscoverySession,
  listDiscoverySessions,
} from "@/lib/discovery-os/discovery-session";

export type { OpportunityScore } from "@/lib/discovery-os/opportunity-scoring";
export {
  scoreOpportunity,
  saveOpportunityScore,
} from "@/lib/discovery-os/opportunity-scoring";

export type { RoiProjection, RoiSnapshot } from "@/lib/discovery-os/roi-projections";
export {
  projectRoi,
  saveRoiProjection,
  getRoiProjection,
} from "@/lib/discovery-os/roi-projections";
