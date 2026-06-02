import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { getBenchmarkReport } from "@/lib/benchmarking";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "practice_manager")) {
    return NextResponse.json({ ok: false, error: "Insufficient role." }, { status: 403 });
  }

  try {
    const report = await getBenchmarkReport(ctx.organizationId);
    return NextResponse.json({ ok: true, data: report });
  } catch (error) {
    console.error("[benchmarking] error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to generate benchmark report." },
      { status: 500 }
    );
  }
}
