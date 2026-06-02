import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { getRevenueOpportunities } from "@/lib/revenue-opportunity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "read_only")) {
    return NextResponse.json({ ok: false, error: "Insufficient role." }, { status: 403 });
  }

  try {
    const data = await getRevenueOpportunities(ctx.organizationId);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[revenue-opportunity] error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to compute revenue opportunities." },
      { status: 500 }
    );
  }
}
