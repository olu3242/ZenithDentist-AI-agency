import { NextResponse } from "next/server";
import {
  createGtmProspect,
  createOperationalRevenueAudit,
  getBusinessGrowthState,
  updateGtmProspectStage,
  gtmStageKeys
} from "@/lib/gtm/business-growth";

export async function GET() {
  const state = await getBusinessGrowthState();
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    if (body.action === "create_prospect") {
      if (typeof body.practiceName !== "string" || !body.practiceName.trim()) {
        return NextResponse.json({ error: "Practice name is required." }, { status: 400 });
      }
      const prospect = await createGtmProspect({
        practiceName: body.practiceName,
        contactName: typeof body.contactName === "string" ? body.contactName : undefined,
        email: typeof body.email === "string" ? body.email : undefined,
        phone: typeof body.phone === "string" ? body.phone : undefined,
        city: typeof body.city === "string" ? body.city : undefined,
        state: typeof body.state === "string" ? body.state : undefined,
        source: typeof body.source === "string" ? body.source : undefined,
        estimatedMonthlyOpportunity: Number(body.estimatedMonthlyOpportunity ?? 0),
        personalizationNotes: typeof body.personalizationNotes === "string" ? body.personalizationNotes : undefined
      });
      return NextResponse.json({ prospect }, { status: 201 });
    }

    if (body.action === "update_stage") {
      if (typeof body.prospectId !== "string" || !gtmStageKeys.includes(body.stage)) {
        return NextResponse.json({ error: "Prospect ID and valid stage are required." }, { status: 400 });
      }
      const prospect = await updateGtmProspectStage({
        prospectId: body.prospectId,
        stage: body.stage,
        nextAction: typeof body.nextAction === "string" ? body.nextAction : undefined
      });
      return NextResponse.json({ prospect });
    }

    if (body.action === "create_audit") {
      if (typeof body.prospectId !== "string") {
        return NextResponse.json({ error: "Prospect ID is required." }, { status: 400 });
      }
      const audit = await createOperationalRevenueAudit({
        prospectId: body.prospectId,
        noShowFindings: typeof body.noShowFindings === "string" ? body.noShowFindings : undefined,
        reviewFindings: typeof body.reviewFindings === "string" ? body.reviewFindings : undefined,
        recallFindings: typeof body.recallFindings === "string" ? body.recallFindings : undefined,
        retentionFindings: typeof body.retentionFindings === "string" ? body.retentionFindings : undefined,
        revenueLeakageEstimate: Number(body.revenueLeakageEstimate ?? 0),
        loomUrl: typeof body.loomUrl === "string" ? body.loomUrl : undefined
      });
      return NextResponse.json({ audit }, { status: 201 });
    }

    return NextResponse.json({ error: "Unsupported GTM action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "GTM action failed." }, { status: 500 });
  }
}
