import { NextResponse } from "next/server";
import {
  calculateGrowthScore,
  getGrowthScore,
  getGrowthScoreHistory,
} from "@/lib/growth-score";

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
  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days");
  try {
    if (daysParam) {
      const days = parseInt(daysParam, 10) || 30;
      const history = await getGrowthScoreHistory(organizationId, days);
      return NextResponse.json({ ok: true, history });
    }
    const score = await getGrowthScore(organizationId);
    return NextResponse.json({ ok: true, score });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }
  try {
    const score = await calculateGrowthScore(organizationId);
    return NextResponse.json({ ok: true, score });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
