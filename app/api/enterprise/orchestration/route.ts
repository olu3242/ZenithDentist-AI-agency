import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId } from "@/lib/tenant/tenant-guards";
import { getRevenueOrchestrationState } from "@/lib/enterprise-cloud";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const ctx = await withTenantGuard(orgId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const state = await getRevenueOrchestrationState();
  return NextResponse.json(state);
}
