import { Resend } from "resend";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { FunnelResult } from "@/lib/data/leads";
import { formatCurrency } from "@/lib/utils";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendAuditEmails(result: FunnelResult) {
  if (!resend) {
    logger.warn("resend_missing_audit_email_skipped", { leadId: result.lead.id });
    return;
  }

  const subject = `Zenith AI audit for ${result.lead.practice_name}`;
  const html = `
    <h1>Your Zenith AI revenue audit is ready</h1>
    <p>${result.audit.audit_summary}</p>
    <p><strong>Projected monthly recovery:</strong> ${formatCurrency(result.audit.projected_recovery)}</p>
    <p>Book your implementation walkthrough from the audit page.</p>
  `;

  await Promise.all([
    resend.emails.send({
      from: "Zenith AI <audit@zenith-ai.com>",
      to: result.lead.email,
      subject,
      html
    }),
    resend.emails.send({
      from: "Zenith AI <ops@zenith-ai.com>",
      to: "ops@zenith-ai.com",
      subject: `New audit request: ${result.lead.practice_name}`,
      html: `<p>${result.lead.practice_name} requested an audit. Projected recovery: ${formatCurrency(result.audit.projected_recovery)}.</p>`
    })
  ]);
}
