import { NextRequest, NextResponse } from "next/server";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const organizationId = new URL(req.url).searchParams.get("organizationId") ?? "";
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "organizationId is required" }, { status: 400 });
  }
  const data = await getWorkflowAnalyticsSummary();
  return NextResponse.json({ ok: true, ...data });
}
