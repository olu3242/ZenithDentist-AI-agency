import { NextResponse } from "next/server";
import {
  getPipelineSummary,
  getProductTiers,
  createPipelineEntry,
  addSalesActivity,
  registerPartner,
  getPartners,
  type SalesPipelineEntry,
} from "@/lib/commercialization";

export async function GET(_request: Request) {
  try {
    const [summary, tiers, partners] = await Promise.all([
      getPipelineSummary(),
      getProductTiers(),
      getPartners(),
    ]);
    return NextResponse.json({ ok: true, summary, tiers, partners });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const action: string = body.action ?? "";
  try {
    if (action === "create_lead") {
      const entry: SalesPipelineEntry = {
        leadName: body.leadName ?? "Unknown",
        practiceName: body.practiceName,
        contactEmail: body.contactEmail,
        stage: body.stage ?? "lead",
        tier: body.tier,
        estimatedMrr: Number(body.estimatedMrr ?? 0),
        probability: Number(body.probability ?? 10),
        expectedCloseDate: body.expectedCloseDate,
        notes: body.notes,
      };
      const id = await createPipelineEntry(entry);
      return NextResponse.json({ ok: true, id });
    }
    if (action === "add_activity") {
      await addSalesActivity(
        body.pipelineId ?? "",
        body.activityType ?? "note",
        body.notes,
        body.outcome
      );
      return NextResponse.json({ ok: true });
    }
    if (action === "register_partner") {
      const id = await registerPartner({
        partnerName: body.partnerName ?? "Unknown",
        partnerType: body.partnerType ?? "referral",
        contactEmail: body.contactEmail,
        contactName: body.contactName,
        commissionRate: body.commissionRate,
      });
      return NextResponse.json({ ok: true, id });
    }
    return NextResponse.json(
      { ok: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
