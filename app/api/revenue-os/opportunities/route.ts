import { NextResponse } from "next/server";
import {
  getOpenOpportunities,
  markOpportunityWon,
  markOpportunityLost,
} from "@/lib/revenue-os";

function getOrganizationId(request: Request): string | null {
  const orgId = request.headers.get("x-organization-id");
  if (orgId) return orgId;
  const { searchParams } = new URL(request.url);
  return searchParams.get("organizationId");
}

export async function GET(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json(
      { ok: false, error: "Missing organizationId" },
      { status: 400 }
    );
  }
  const { searchParams } = new URL(request.url);
  const minScoreParam = searchParams.get("minScore");
  const minScore =
    minScoreParam !== null ? Number(minScoreParam) : undefined;
  try {
    const opportunities = await getOpenOpportunities(organizationId, minScore);
    return NextResponse.json({ ok: true, opportunities });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json(
      { ok: false, error: "Missing organizationId" },
      { status: 400 }
    );
  }
  const body = await request.json().catch(() => ({}));
  const { id, action, revenueRealized } = body as {
    id?: string;
    action?: string;
    revenueRealized?: number;
  };
  if (!id || !action) {
    return NextResponse.json(
      { ok: false, error: "Missing id or action" },
      { status: 400 }
    );
  }
  try {
    if (action === "won") {
      await markOpportunityWon(
        organizationId,
        id,
        revenueRealized ?? 0
      );
      return NextResponse.json({ ok: true });
    }
    if (action === "lost") {
      await markOpportunityLost(organizationId, id);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json(
      { ok: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
