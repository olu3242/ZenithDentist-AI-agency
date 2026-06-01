import { NextRequest, NextResponse } from "next/server";
import { getOrganizationRevenueSummary } from "@/lib/revenue-attribution";
import { current_org_id } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * GET /api/dental/revenue-summary?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Returns aggregated revenue attribution for the organization across all engines.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const end = endParam ? new Date(endParam) : new Date();
  const start = startParam
    ? new Date(startParam)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // default: last 30 days

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ ok: false, error: "Invalid date parameters" }, { status: 400 });
  }

  const organizationId = await current_org_id();
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Organization not found" }, { status: 404 });
  }

  const summary = await getOrganizationRevenueSummary(organizationId, { start, end });

  return NextResponse.json({ ok: true, data: summary });
}
