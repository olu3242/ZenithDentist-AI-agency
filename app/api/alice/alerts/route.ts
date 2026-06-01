import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { getAutonomousEngineState } from "@/lib/autonomous";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const state = await getAutonomousEngineState();
  return NextResponse.json({
    ok: true,
    alerts: state.timeline.filter(item => item.severity === "warning" || item.severity === "critical")
  });
}
