import { NextResponse } from "next/server";
import {
  getAliceAccuracyMetrics,
  getAliceLearningSignals,
  recordAliceOutcome,
  type AliceOutcomeRecord,
} from "@/lib/alice/outcome-reconciliation";

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
    const [accuracyMetrics, learningSignals] = await Promise.all([
      getAliceAccuracyMetrics(organizationId),
      getAliceLearningSignals(organizationId),
    ]);

    return NextResponse.json({ ok: true, accuracyMetrics, learningSignals });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({})) as {
    aliceDecisionId?: string;
    patientExternalId?: string;
    decisionType?: string;
    recommendedAction?: string;
    outcomeType?: AliceOutcomeRecord["outcomeType"];
    revenueAttributed?: number;
    feedbackSignal?: AliceOutcomeRecord["feedbackSignal"];
  };

  if (!body.aliceDecisionId || !body.patientExternalId || !body.decisionType || !body.recommendedAction) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields: aliceDecisionId, patientExternalId, decisionType, recommendedAction" },
      { status: 400 }
    );
  }

  try {
    const id = await recordAliceOutcome({
      organizationId,
      aliceDecisionId: body.aliceDecisionId,
      patientExternalId: body.patientExternalId,
      decisionType: body.decisionType,
      recommendedAction: body.recommendedAction,
      outcomeType: body.outcomeType,
      revenueAttributed: body.revenueAttributed,
      feedbackSignal: body.feedbackSignal,
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
