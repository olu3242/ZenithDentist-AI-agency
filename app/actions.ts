"use server";

import { revalidatePath } from "next/cache";
import { createLeadFunnel, trackBookingClick, trackOutreachEvent } from "@/lib/data/leads";
import { sendAuditEmails } from "@/lib/email";
import { logger } from "@/lib/logger";
import { funnelSubmissionSchema } from "@/lib/validation";

export type FunnelActionState = {
  ok: boolean;
  message: string;
  leadId?: string;
  auditId?: string;
  projectedRecovery?: number;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function submitFunnelAction(input: unknown): Promise<FunnelActionState> {
  const parsed = funnelSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  try {
    const result = await createLeadFunnel(parsed.data);
    await sendAuditEmails(result);
    revalidatePath("/admin");
    return {
      ok: true,
      message: "Audit generated. Your projected recovery is ready.",
      leadId: result.lead.id,
      auditId: result.audit.id,
      projectedRecovery: result.audit.projected_recovery
    };
  } catch (error) {
    logger.error("funnel_submit_failed", {
      error: error instanceof Error ? error.message : "unknown"
    });
    return {
      ok: false,
      message: "We could not save the audit yet. Check Supabase and Resend configuration, then retry."
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
