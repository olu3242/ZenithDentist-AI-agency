import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { getRevenueRecoverySummary } from "@/lib/dental-revenue-os/revenue-recovery";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const data = await getRevenueRecoverySummary(ctx.organizationId);
  return NextResponse.json({ ok: true, ...data });
}
