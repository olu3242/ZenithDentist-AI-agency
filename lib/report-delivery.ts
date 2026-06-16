import "server-only";

import { randomUUID } from "crypto";
import type { Json } from "@/lib/database.types";
import type { Audit, FunnelResult, Lead, RoiCalculation } from "@/lib/data/leads";
import { sendAuditEmails } from "@/lib/email";
import { getErrorDiagnostics, supabaseErrorContext } from "@/lib/external-diagnostics";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/server";

export const REPORT_GENERATED_EVENT = "report.generated";
export const REPORT_GENERATED_WORKFLOW_ID = "report_generated";

export class ReportDeliveryError extends Error {
  constructor(message: string, public readonly details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ReportDeliveryError";
  }
}

export async function resolveWorkflowOrganizationId(preferred?: string | null) {
  if (preferred) return preferred;
  const supabase = createServiceClient();
  if (!supabase) throw new ReportDeliveryError("Supabase service client is unavailable.");

  const bySlug = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG ?? "demo-dental-group")
    .maybeSingle();
  if (bySlug.data?.id) return bySlug.data.id;

  const firstOrg = await supabase
    .from("organizations")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstOrg.data?.id) return firstOrg.data.id;

  throw new ReportDeliveryError("No organization is available for Workflow OS event persistence.");
}

export async function publishReportGeneratedEvent(input: {
  organizationId: string;
  lead: Lead;
  roi: RoiCalculation;
  audit: Audit;
  correlationId?: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) throw new ReportDeliveryError("Supabase service client is unavailable.");

  const payload = {
    workflow_id: REPORT_GENERATED_WORKFLOW_ID,
    correlation_id: input.correlationId ?? randomUUID(),
    lead_id: input.lead.id,
    assessment_id: input.roi.id,
    audit_id: input.audit.id,
    recipient_email: input.lead.email,
    practice_name: input.lead.practice_name,
    projected_recovery: input.audit.projected_recovery,
    generated_at: input.audit.generated_at
  };

  const { data, error } = await (supabase as any)
    .from("workflow_events")
    .insert({
      organization_id: input.organizationId,
      event_type: REPORT_GENERATED_EVENT,
      status: "recorded",
      payload: payload as Json
    })
    .select()
    .single();

  if (error || !data) {
    throw new ReportDeliveryError("Unable to persist report.generated workflow event.", {
      error: error ? supabaseErrorContext({ table: "workflow_events", operation: "insert", payload, error }) : null
    });
  }

  return data as { id: string; event_type: string; status: string; payload: Json };
}

export async function deliverGeneratedReportEmail(input: {
  organizationId: string;
  auditId: string;
  leadId?: string;
  assessmentId?: string;
  workflowEventId?: string;
  correlationId?: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) throw new ReportDeliveryError("Supabase service client is unavailable.");

  const result = await loadFunnelResult(input.auditId, input.leadId);
  const deliveryResults = await sendAuditEmails(result, {}, input.organizationId);
  const failed = deliveryResults.filter(item => !item.ok);
  const providerMessageIds = deliveryResults.map(item => item.externalId).filter(Boolean);
  const deliveryPayload = {
    workflowEventId: input.workflowEventId,
    correlationId: input.correlationId,
    leadId: result.lead.id,
    assessmentId: result.roi.id,
    auditId: result.audit.id,
    recipient: result.lead.email,
    subject: `Your FREE Revenue Opportunity Assessment for ${result.lead.practice_name}`,
    providerResults: deliveryResults
  };

  await (supabase as any).from("workflow_events").insert({
    organization_id: input.organizationId,
    event_type: failed.length ? "report.email.failed" : "report.email.sent",
    status: failed.length ? "failed" : "recorded",
    payload: deliveryPayload as Json
  });

  if (!failed.length) {
    await (supabase as any).from("outreach_events").insert({
      lead_id: result.lead.id,
      event_type: "email_sent",
      event_metadata: deliveryPayload as Json,
      organization_id: input.organizationId
    });
  }

  if (failed.length) {
    throw new ReportDeliveryError("Generated report email delivery failed.", {
      ...deliveryPayload,
      failures: failed
    });
  }

  logger.info("generated_report_email_delivered", {
    leadId: result.lead.id,
    auditId: result.audit.id,
    providerMessageIds
  });

  return {
    ok: true,
    leadId: result.lead.id,
    auditId: result.audit.id,
    assessmentId: result.roi.id,
    providerMessageIds,
    providerResults: deliveryResults
  };
}

async function loadFunnelResult(auditId: string, leadId?: string): Promise<FunnelResult> {
  const supabase = createServiceClient();
  if (!supabase) throw new ReportDeliveryError("Supabase service client is unavailable.");

  const auditResult = await supabase.from("audits").select("*").eq("id", auditId).maybeSingle();
  if (auditResult.error || !auditResult.data) {
    throw new ReportDeliveryError("Generated audit report could not be loaded.", {
      auditId,
      error: auditResult.error ? getErrorDiagnostics(auditResult.error) : null
    });
  }

  const resolvedLeadId = leadId ?? auditResult.data.lead_id;
  const leadResult = await supabase.from("leads").select("*").eq("id", resolvedLeadId).maybeSingle();
  if (leadResult.error || !leadResult.data) {
    throw new ReportDeliveryError("Lead email could not be loaded for generated report.", {
      leadId: resolvedLeadId,
      error: leadResult.error ? getErrorDiagnostics(leadResult.error) : null
    });
  }

  const roiResult = await supabase
    .from("roi_calculations")
    .select("*")
    .eq("lead_id", resolvedLeadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (roiResult.error || !roiResult.data) {
    throw new ReportDeliveryError("ROI calculation could not be loaded for generated report.", {
      leadId: resolvedLeadId,
      error: roiResult.error ? getErrorDiagnostics(roiResult.error) : null
    });
  }

  return {
    lead: leadResult.data as Lead,
    roi: roiResult.data as RoiCalculation,
    audit: auditResult.data as Audit
  };
}
