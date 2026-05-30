import "server-only";

export type { AutomationBaseline } from "@/lib/roi-proof-engine/baseline-capture";
export {
  captureBaseline,
  getBaseline,
} from "@/lib/roi-proof-engine/baseline-capture";

export type { ImpactSummary } from "@/lib/roi-proof-engine/impact-measurement";
export {
  measureImpact,
  getImpactSummary,
} from "@/lib/roi-proof-engine/impact-measurement";

export type {
  ImpactReport,
  QuarterlyReport,
  AnnualReport,
} from "@/lib/roi-proof-engine/report-generator";
export {
  generateMonthlyImpactReport,
  generateQuarterlyReport,
  generateAnnualValueReport,
} from "@/lib/roi-proof-engine/report-generator";
