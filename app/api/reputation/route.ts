import { NextResponse } from "next/server";
import {
  getReputationSummary,
  recordReviewRequest,
  recordReviewReceived,
  recordReviewResponse,
} from "@/lib/reputation-engine";

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
    const summary = await getReputationSummary(organizationId);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const { action } = body as { action?: string };

  try {
    if (action === "recordReviewRequest") {
      const { patientExternalId, platform } = body as {
        patientExternalId: string;
        platform?: string;
      };
      if (!patientExternalId) {
        return NextResponse.json({ ok: false, error: "Missing patientExternalId" }, { status: 400 });
      }
      await recordReviewRequest(organizationId, patientExternalId, platform);
      return NextResponse.json({ ok: true });
    }

    if (action === "recordReviewReceived") {
      const { patientExternalId, platform, rating, reviewText, sentiment } = body as {
        patientExternalId: string;
        platform: string;
        rating: number;
        reviewText?: string;
        sentiment?: string;
      };
      if (!patientExternalId || !platform || rating == null) {
        return NextResponse.json(
          { ok: false, error: "Missing required fields: patientExternalId, platform, rating" },
          { status: 400 }
        );
      }
      await recordReviewReceived({
        organizationId,
        patientExternalId,
        platform,
        rating,
        reviewText,
        sentiment,
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "recordReviewResponse") {
      const { reviewEventId } = body as { reviewEventId: string };
      if (!reviewEventId) {
        return NextResponse.json({ ok: false, error: "Missing reviewEventId" }, { status: 400 });
      }
      await recordReviewResponse(organizationId, reviewEventId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
