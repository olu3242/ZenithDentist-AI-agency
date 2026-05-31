import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { getErrorDashboard } from "@/lib/monitoring/error-dashboard";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId);
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "practice_manager")) {
    return NextResponse.json({ ok: false, error: "Insufficient role." }, { status: 403 });
  }

  try {
    const isPlatformAdmin = roleAtLeast(ctx.membershipRole, "platform_admin");
    const dashboard = await getErrorDashboard(isPlatformAdmin ? undefined : ctx.organizationId);
    return NextResponse.json({ ok: true, data: dashboard });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to load error dashboard." }, { status: 500 });
  }
}
