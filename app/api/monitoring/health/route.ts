import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { getOperationalHealthDashboard } from "@/lib/monitoring";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId);
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "practice_manager")) {
    return NextResponse.json({ ok: false, error: "Insufficient role." }, { status: 403 });
  }

  try {
    const dashboard = await getOperationalHealthDashboard(ctx.organizationId);
    return NextResponse.json({ ok: true, data: dashboard });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to retrieve health dashboard." }, { status: 500 });
  }
}
