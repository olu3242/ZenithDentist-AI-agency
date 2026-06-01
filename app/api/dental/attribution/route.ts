import { NextRequest, NextResponse } from "next/server";
import { getWorkflowAttribution } from "@/lib/revenue-attribution";
import { current_org_id } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * GET /api/dental/attribution?workflowId=X&start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Returns revenue attribution for a specific workflow within a date range.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workflowId = searchParams.get("workflowId");
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  if (!workflowId) {
    return NextResponse.json({ ok: false, error: "workflowId is required" }, { status: 400 });
  }

  const end = endParam ? new Date(endParam) : new Date();
  const start = startParam
    ? new Date(startParam)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ ok: false, error: "Invalid date parameters" }, { status: 400 });
  }

  const organizationId = await current_org_id();
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Organization not found" }, { status: 404 });
  }

  const attribution = await getWorkflowAttribution(workflowId, organizationId, { start, end });

  return NextResponse.json({ ok: true, data: attribution });
}
