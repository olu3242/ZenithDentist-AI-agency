import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type ComplianceAgentTask = {
  organizationId: string;
};

export type ComplianceFinding = {
  area: string;
  status: "compliant" | "gap" | "unknown";
  detail: string;
};

export type ComplianceAgentResult = {
  ok: boolean;
  findings: ComplianceFinding[];
};

export async function runComplianceAgentTask(task: ComplianceAgentTask): Promise<ComplianceAgentResult> {
  const { organizationId } = task;
  const supabase = createServiceClient();
  const findings: ComplianceFinding[] = [];

  try {
    // Check consent_records
    try {
      if (supabase) {
        const { data: consentRows, error: consentError } = await (supabase as any)
          .from("consent_records")
          .select("id, consent_given")
          .eq("organization_id", organizationId)
          .limit(100);

        if (consentError) {
          findings.push({ area: "consent_records", status: "unknown", detail: "Unable to query consent records." });
        } else {
          const total = (consentRows ?? []).length;
          const given = ((consentRows ?? []) as any[]).filter((r: any) => r.consent_given === true).length;
          if (total === 0) {
            findings.push({ area: "consent_records", status: "unknown", detail: "No consent records found." });
          } else {
            const coverage = Math.round((given / total) * 100);
            findings.push({
              area: "consent_records",
              status: coverage >= 95 ? "compliant" : "gap",
              detail: `Consent coverage: ${coverage}% (${given}/${total} patients).`,
            });
          }
        }
      } else {
        findings.push({ area: "consent_records", status: "unknown", detail: "Database unavailable." });
      }
    } catch {
      findings.push({ area: "consent_records", status: "unknown", detail: "Consent records check failed gracefully." });
    }

    // Check avatar_profiles for consent_given
    try {
      if (supabase) {
        const { data: avatarRows } = await (supabase as any)
          .from("avatar_profiles")
          .select("id, consent_given")
          .eq("organization_id", organizationId)
          .limit(200);

        const total = (avatarRows ?? []).length;
        const consented = ((avatarRows ?? []) as any[]).filter((r: any) => r.consent_given === true).length;
        if (total === 0) {
          findings.push({ area: "avatar_consent", status: "unknown", detail: "No avatar profiles found." });
        } else {
          const coverage = Math.round((consented / total) * 100);
          findings.push({
            area: "avatar_consent",
            status: coverage >= 90 ? "compliant" : "gap",
            detail: `Avatar consent coverage: ${coverage}% (${consented}/${total}).`,
          });
        }
      } else {
        findings.push({ area: "avatar_consent", status: "unknown", detail: "Database unavailable." });
      }
    } catch {
      findings.push({ area: "avatar_consent", status: "unknown", detail: "Avatar consent check failed gracefully." });
    }

    // Check workflow_executions for failures
    try {
      if (supabase) {
        const { data: failedWorkflows } = await (supabase as any)
          .from("workflow_executions")
          .select("id, status, workflow_id")
          .eq("organization_id", organizationId)
          .eq("status", "failed")
          .limit(50);

        const failCount = (failedWorkflows ?? []).length;
        findings.push({
          area: "workflow_audit",
          status: failCount === 0 ? "compliant" : failCount <= 5 ? "gap" : "gap",
          detail: `${failCount} failed workflow executions detected.`,
        });
      } else {
        findings.push({ area: "workflow_audit", status: "unknown", detail: "Database unavailable." });
      }
    } catch {
      findings.push({ area: "workflow_audit", status: "unknown", detail: "Workflow audit check failed gracefully." });
    }

    if (supabase) {
      (async () => {
        try {
          await (supabase as any).from("agent_tasks").insert({
            organization_id: organizationId,
            agent_key: "compliance_agent",
            status: "completed",
            result: { findings },
            created_at: new Date().toISOString(),
          });
          await (supabase as any).from("agent_events").insert({
            organization_id: organizationId,
            agent_key: "compliance_agent",
            event_type: "agent.completed",
            payload: { findings },
            created_at: new Date().toISOString(),
          });
        } catch (err) {
          logger.warn("compliance_agent.persist_failed_non_blocking", { error: String(err) });
        }
      })();
    }

    logger.info("compliance_agent.task_completed", { organizationId, findingCount: findings.length });
    return { ok: true, findings };
  } catch (err) {
    logger.error("compliance_agent.task_failed", { organizationId, error: String(err) });
    return { ok: false, findings };
  }
}
