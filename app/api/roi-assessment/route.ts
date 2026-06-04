import { NextResponse } from "next/server";
import { createLeadFunnel, RevenueAuditError } from "@/lib/data/leads";
import { sendAuditEmails } from "@/lib/email";
import { logger } from "@/lib/logger";
import { getErrorDiagnostics } from "@/lib/external-diagnostics";
import { funnelSubmissionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = funnelSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({
      ok: false,
      error: "Invalid FREE Revenue Opportunity Assessment payload.",
      fieldErrors: parsed.error.flatten().fieldErrors
    }, { status: 400 });
  }

  try {
    const result = await createLeadFunnel({
      ...parsed.data,
      source: "free_revenue_opportunity_assessment",
      attribution: {
        ...parsed.data.attribution,
        assessmentName: "FREE Revenue Opportunity Assessment",
        consultingValue: 1500
      }
    });

    void sendAuditEmails(result).catch(error => {
      logger.warn("roi_assessment_email_failed_non_blocking", {
        leadId: result.lead.id,
        error: getErrorDiagnostics(error)
      });
    });

    return NextResponse.json({
      ok: true,
      leadId: result.lead.id,
      auditId: result.audit.id,
      missionControlLeadStatus: result.lead.status,
      assessment: {
        name: "FREE Revenue Opportunity Assessment",
        consultingValue: 1500,
        revenueRecoveryEstimate: result.audit.projected_recovery,
        practiceHealthScore: result.roi.practice_health_score,
        revenueRecoveryOpportunity: result.roi.revenue_recovery_opportunity,
        recallOpportunity: result.roi.recall_opportunity,
        treatmentOpportunity: result.roi.treatment_opportunity,
        chairFillOpportunity: result.roi.chair_fill_opportunity,
        reviewOpportunity: result.audit.alice_report && typeof result.audit.alice_report === "object" && "reviewOpportunity" in result.audit.alice_report
          ? result.audit.alice_report.reviewOpportunity
          : null,
        referralOpportunity: result.audit.alice_report && typeof result.audit.alice_report === "object" && "referralOpportunity" in result.audit.alice_report
          ? result.audit.alice_report.referralOpportunity
          : null
      }
    });
  } catch (error) {
    logger.error("roi_assessment_submit_failed", {
      error: getErrorDiagnostics(error)
    });

    if (error instanceof RevenueAuditError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ ok: false, error: "Unable to generate the FREE Revenue Opportunity Assessment." }, { status: 500 });
  }
}
