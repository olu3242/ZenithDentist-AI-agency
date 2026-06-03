"use server";

import { revalidatePath } from "next/cache";
import { createLeadFunnel, RevenueAuditError, trackBookingClick, trackOutreachEvent } from "@/lib/data/leads";
import { publishFunnelEvent } from "@/lib/event-fabric";
import { sendAuditEmails } from "@/lib/email";
import { logger } from "@/lib/logger";
import { getErrorDiagnostics } from "@/lib/external-diagnostics";
import { funnelSubmissionSchema } from "@/lib/validation";

export type FunnelActionState = {
  ok: boolean;
  message: string;
  leadId?: string;
  auditId?: string;
  assessmentId?: string;
  projectedRecovery?: number;
  practiceHealthScore?: number | null;
  revenueRecoveryOpportunity?: number | null;
  recallOpportunity?: number | null;
  treatmentOpportunity?: number | null;
  chairFillOpportunity?: number | null;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function submitFunnelAction(input: unknown): Promise<FunnelActionState> {
  logger.info("[AUDIT] Request Received", {
    source: getInputString(input, "source"),
    practiceName: getInputString(input, "practiceName"),
    email: maskEmail(getInputString(input, "email"))
  });

  const parsed = funnelSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    logger.warn("[AUDIT] Validation Failed", {
      fieldErrors: parsed.error.flatten().fieldErrors
    });
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  logger.info("[AUDIT] Validation Passed", {
    source: parsed.data.source,
    practiceName: parsed.data.practiceName,
    email: maskEmail(parsed.data.email)
  });

  try {
    void publishFunnelEvent({
      eventType: "assessment_started",
      metadata: { source: parsed.data.source, practiceName: parsed.data.practiceName }
    });

    const result = await createLeadFunnel(parsed.data);
    logger.info("[AUDIT] Email Send", {
      status: "queued",
      leadId: result.lead.id,
      auditId: result.audit.id
    });
    void sendAuditEmails(result).then(() => {
      logger.info("[AUDIT] Email Send", {
        status: "success",
        leadId: result.lead.id,
        auditId: result.audit.id
      });
    }).catch(error => {
      logger.warn("[AUDIT] Email Send", {
        status: "failed_non_blocking",
        leadId: result.lead.id,
        auditId: result.audit.id,
        error: getErrorDiagnostics(error)
      });
    });
    revalidatePath("/admin");
    logger.info("[AUDIT] Success", {
      leadId: result.lead.id,
      auditId: result.audit.id,
      projectedRecovery: result.audit.projected_recovery
    });
    return {
      ok: true,
      message: "Your Practice Growth Report is ready. Book your strategy session to review the findings.",
      leadId: result.lead.id,
      auditId: result.audit.id,
      assessmentId: result.roi.id,
      projectedRecovery: result.audit.projected_recovery,
      practiceHealthScore: result.roi.practice_health_score,
      revenueRecoveryOpportunity: result.roi.revenue_recovery_opportunity,
      recallOpportunity: result.roi.recall_opportunity,
      treatmentOpportunity: result.roi.treatment_opportunity,
      chairFillOpportunity: result.roi.chair_fill_opportunity
    };
  } catch (error) {
    const diagnostics = getErrorDiagnostics(error);
    logger.error("funnel_submit_failed", {
      error: diagnostics
    });
    logger.error("[AUDIT] Failure", {
      status: "failed",
      error: diagnostics
    });
    return {
      ok: false,
      message: getFunnelFailureMessage(error)
    };
  }
}

export async function trackBookingClickAction(input: { leadId?: string; source?: string }) {
  await trackBookingClick(input.leadId, { source: input.source ?? "website" });
}

export async function trackCtaClickAction(input: { label: string; source: string }) {
  await trackOutreachEvent({
    eventType: "cta_clicked",
    metadata: input
  });
}

function getInputString(input: unknown, key: string) {
  if (!input || typeof input !== "object") return undefined;
  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function maskEmail(value: string | undefined) {
  if (!value) return undefined;
  const [name, domain] = value.split("@");
  if (!domain) return "[redacted]";
  return `${name.slice(0, 2)}***@${domain}`;
}

function getFunnelFailureMessage(error: unknown) {
  if (error instanceof RevenueAuditError) {
    if (error.code === "SUPABASE_SERVICE_CLIENT_UNAVAILABLE") {
      return "Unable to initialize Supabase admin client.";
    }
    if (error.code === "LEAD_INSERT_FAILED") {
      return "Revenue audit lead insert failed. Check the leads table and RLS policy.";
    }
    if (error.code === "ROI_INSERT_FAILED") {
      return "Revenue audit calculation insert failed. Check the roi_calculations table.";
    }
    if (error.code === "AUDIT_INSERT_FAILED") {
      return "Revenue audit report insert failed. Check the audits table.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Revenue audit failed for an unknown server-side reason.";
}
