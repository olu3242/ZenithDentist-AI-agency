import "server-only";

/**
 * Implementation Health — portfolio view of all implementations in progress.
 */

import { computeImplementationScorecard } from "@/lib/implementation-os/implementation-scorecard";
import { createServiceClient } from "@/lib/supabase/server";

export interface ImplementationPortfolio {
  total: number;
  onTrack: number;
  atRisk: number;
  blocked: number;
  complete: number;
  averageScore: number;
  implementations: Array<{ organizationId: string; score: number; readyForGoLive: boolean; blockers: string[] }>;
  computedAt: string;
}

export async function getImplementationPortfolio(): Promise<ImplementationPortfolio> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { total: 0, onTrack: 0, atRisk: 0, blocked: 0, complete: 0, averageScore: 0, implementations: [], computedAt: new Date().toISOString() };
  }

  const { data: runs } = await supabase
    .from("tenant_onboarding_runs")
    .select("organization_id, status")
    .limit(50);

  const implementations = [];
  for (const run of runs ?? []) {
    const scorecard = await computeImplementationScorecard(run.organization_id);
    implementations.push({
      organizationId: run.organization_id,
      score: scorecard.overallScore,
      readyForGoLive: scorecard.readyForGoLive,
      blockers: scorecard.blockers,
    });
  }

  const avgScore = implementations.length > 0
    ? Math.round(implementations.reduce((s, i) => s + i.score, 0) / implementations.length)
    : 0;

  return {
    total: implementations.length,
    onTrack: implementations.filter(i => i.score >= 75).length,
    atRisk: implementations.filter(i => i.score >= 50 && i.score < 75).length,
    blocked: implementations.filter(i => i.blockers.length > 0).length,
    complete: implementations.filter(i => i.readyForGoLive).length,
    averageScore: avgScore,
    implementations,
    computedAt: new Date().toISOString(),
  };
}
