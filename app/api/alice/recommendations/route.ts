import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { getAutonomousPlaybooks } from "@/lib/autonomous";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const recommendations = getAutonomousPlaybooks().map(playbook => ({
    title: playbook.name,
    recommendation: playbook.recommendedActions[0],
    expectedImprovement: playbook.expectedOutcomes,
    confidence: playbook.confidence
  }));

  return NextResponse.json({ ok: true, recommendations });
}
