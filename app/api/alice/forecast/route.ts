import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { getPortalData } from "@/lib/data/operations";
import { buildPredictiveInsights } from "@/lib/health";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const data = await getPortalData(ctx.organizationId);
  return NextResponse.json({ ok: true, forecasts: buildPredictiveInsights(data.metrics) });
}
