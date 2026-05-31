import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { getEnterpriseControlData } from "@/lib/tenant/enterprise-control";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId);
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "platform_admin")) {
    return NextResponse.json({ ok: false, error: "Platform admin role required." }, { status: 403 });
  }

  try {
    const data = await getEnterpriseControlData();
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to load enterprise data." }, { status: 500 });
  }
}
