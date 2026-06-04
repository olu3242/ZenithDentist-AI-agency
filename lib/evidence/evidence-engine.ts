import "server-only";

import { certificationSubsystems } from "@/lib/evidence/evidence-registry";
import { calculateExecutiveReadinessIndex, validateGoLiveGates } from "@/lib/evidence/evidence-validator";
import { createServiceClient } from "@/lib/supabase/server";

export async function getEvidenceCoverage(organizationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return emptyCoverage();
  const client = supabase as any;
  const counts = Object.fromEntries(await Promise.all([
    "automation_evidence",
    "workflow_evidence",
    "revenue_evidence",
    "patient_journey_evidence",
    "relationship_evidence",
    "video_evidence",
    "alice_evidence",
    "liz_evidence",
    "compliance_evidence",
    "revenue_attributions",
    "alice_decisions",
    "incidents",
    "recovery_actions",
    "sla_events"
  ].map(async table => [table, await countRows(client, table, organizationId)])));

  const scores = {
    evidence: percentage(counts.automation_evidence + counts.workflow_evidence + counts.compliance_evidence, 3),
    revenue_attribution: percentage(counts.revenue_evidence + counts.revenue_attributions, 2),
    alice_traceability: percentage(counts.alice_evidence + counts.alice_decisions, 2),
    incident_coverage: percentage(counts.incidents + counts.compliance_evidence, 2),
    recovery_coverage: percentage(counts.recovery_actions + counts.compliance_evidence, 2),
    sla_coverage: percentage(counts.sla_events + counts.compliance_evidence, 2)
  };
  return {
    counts,
    scores,
    readiness: calculateExecutiveReadinessIndex(scores),
    gates: validateGoLiveGates(scores).gates
  };
}

export async function runEnterpriseCertification(organizationId: string, runType = "nightly") {
  const supabase = createServiceClient();
  const coverage = await getEvidenceCoverage(organizationId);
  if (!supabase) return { persisted: false, coverage };
  const client = supabase as any;
  const { data: run } = await client.from("enterprise_certification_runs").insert({
    organization_id: organizationId,
    run_type: runType,
    status: "completed",
    readiness_index: coverage.readiness.score,
    completed_at: new Date().toISOString(),
    metadata: { readiness_level: coverage.readiness.level }
  }).select("id").single();
  if (run?.id) {
    await client.from("enterprise_certification_results").insert(coverage.gates.map(gate => ({
      organization_id: organizationId,
      certification_run_id: run.id,
      subsystem: gate.subsystem,
      status: gate.status,
      score: gate.score,
      threshold: gate.threshold,
      detail: `${gate.subsystem} scored ${gate.score}/${gate.threshold}.`,
      evidence: coverage.counts
    })));
  }
  return { persisted: Boolean(run?.id), coverage };
}

function emptyCoverage() {
  const scores = Object.fromEntries(certificationSubsystems.map(item => [item.key, 0]));
  return { counts: {}, scores, readiness: calculateExecutiveReadinessIndex(scores), gates: validateGoLiveGates(scores).gates };
}

async function countRows(client: any, table: string, organizationId: string) {
  const { count } = await client.from(table).select("id", { count: "exact", head: true }).eq("organization_id", organizationId);
  return count ?? 0;
}

function percentage(actual: number, expected: number) {
  return Math.min(100, Math.round((actual / Math.max(1, expected)) * 100));
}
