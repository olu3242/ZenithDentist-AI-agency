import { NextResponse } from "next/server";
import {
  generateExecutiveBriefing,
  getLatestExecutiveBriefing,
  detectRevenueRisk,
  detectRecallRisk,
} from "@/lib/alice/executive-briefing";
import { recordRecommendationFeedback } from "@/lib/alice/knowledge-evolution";

function getOrganizationId(request: Request): string | null {
  const orgId = request.headers.get("x-organization-id");
  if (orgId) return orgId;
  const { searchParams } = new URL(request.url);
  return searchParams.get("organizationId");
}

export async function GET(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }
  try {
    const briefing = await getLatestExecutiveBriefing(organizationId);
    return NextResponse.json({ ok: true, briefing });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = body.action as string | undefined;

  try {
    if (action === "generate") {
      const briefing = await generateExecutiveBriefing(organizationId);
      return NextResponse.json({ ok: true, briefing });
    }

    if (action === "detect_risk") {
      const [revenueRisks, recallRisk] = await Promise.all([
        detectRevenueRisk(organizationId),
        detectRecallRisk(organizationId),
      ]);
      return NextResponse.json({ ok: true, revenueRisks, recallRisk });
    }

    if (action === "record_feedback") {
      await recordRecommendationFeedback({
        organizationId,
        recommendationId: body.recommendationId as string | undefined,
        recommendationType: body.recommendationType as string | undefined,
        accepted: body.accepted as boolean,
        outcomeRevenueImpact: body.outcomeRevenueImpact as number | undefined,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
