import { statusForScore } from "@/lib/evidence/evidence-validator";

export interface SlaSnapshot {
  availability: number;
  response: number;
  resolution: number;
  recovery: number;
}

export function calculateSlaCompliance(snapshot: SlaSnapshot) {
  const compliance = Math.round((snapshot.availability + snapshot.response + snapshot.resolution + snapshot.recovery) / 4);
  return {
    compliance,
    status: statusForScore(compliance),
    errorBudgetRemaining: Math.max(0, 100 - (100 - compliance)),
    forecastedBreach: compliance < 95
  };
}
