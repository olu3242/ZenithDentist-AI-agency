import { Resend } from "resend";
import { env } from "@/lib/env";
import { brandConfig } from "@/lib/brand";
import { logger } from "@/lib/logger";
import type { FunnelResult } from "@/lib/data/leads";
import { getLocalizedCurrency, getLocalizedText, type LocalizationContext } from "@/lib/localized-messaging";
import { formatCurrency } from "@/lib/utils";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendAuditEmails(result: FunnelResult, localization: LocalizationContext = {}) {
  if (!resend) {
    logger.warn("resend_missing_audit_email_skipped", { leadId: result.lead.id });
    return;
  }

  const subject = `Your FREE Revenue Opportunity Assessment for ${result.lead.practice_name}`;
  const practiceHealthScore = result.roi.practice_health_score ? `${result.roi.practice_health_score}/100` : "Pending";
  const recallOpportunity = result.roi.recall_opportunity ?? 0;
  const treatmentOpportunity = result.roi.treatment_opportunity ?? 0;
  const chairFillOpportunity = result.roi.chair_fill_opportunity ?? 0;
  const html = `
    <p style="color:${brandConfig.colors.primary};font-weight:900;letter-spacing:.12em;text-transform:uppercase">${brandConfig.trademark}</p>
    <h1>Your FREE Revenue Opportunity Report is ready</h1>
    <p><strong>$1,500 Consulting Value — FREE</strong></p>
    <p>${result.audit.audit_summary}</p>
    <p><strong>Practice Health Score:</strong> ${practiceHealthScore}</p>
    <p><strong>Revenue Recovery Estimate:</strong> ${formatCurrency(result.audit.projected_recovery)}</p>
    <ul>
      <li>Recall Opportunity: ${formatCurrency(recallOpportunity)}</li>
      <li>Treatment Opportunity: ${formatCurrency(treatmentOpportunity)}</li>
      <li>Chair Fill Opportunity: ${formatCurrency(chairFillOpportunity)}</li>
    </ul>
    <p>Book your implementation walkthrough to review the recommended Zenith PROS Revenue Playbooks.</p>
  `;

  await Promise.all([
    resend.emails.send({
      from: `${brandConfig.name} <audit@zenith-ai.com>`,
      to: result.lead.email,
      subject,
      html
    }),
    resend.emails.send({
      from: `${brandConfig.name} <ops@zenith-ai.com>`,
      to: "ops@zenith-ai.com",
      subject: `New FREE Revenue Assessment: ${result.lead.practice_name}`,
      html: `
        <h1>Mission Control Lead Created</h1>
        <p><strong>Practice:</strong> ${result.lead.practice_name}</p>
        <p><strong>Contact:</strong> ${result.lead.dentist_name}</p>
        <p><strong>Email:</strong> ${result.lead.email}</p>
        <p><strong>Phone:</strong> ${result.lead.phone ?? "Not provided"}</p>
        <p><strong>PMS:</strong> ${result.lead.pms_software ?? "Unknown"}</p>
        <p><strong>Locations:</strong> ${result.lead.locations}</p>
        <p><strong>Practice Health Score:</strong> ${practiceHealthScore}</p>
        <p><strong>Revenue Recovery Estimate:</strong> ${formatCurrency(result.audit.projected_recovery)}</p>
        <p><strong>Lead Source:</strong> FREE Revenue Opportunity Assessment</p>
      `
    })
  ]);
}
