import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { generateROIProofReport } from "@/lib/roi-proof-engine";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId);
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "read_only")) {
    return NextResponse.json({ ok: false, error: "Insufficient role." }, { status: 403 });
  }

  try {
    const report = await generateROIProofReport(ctx.organizationId);
    return NextResponse.json({ ok: true, data: report });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to generate ROI report." }, { status: 500 });
  }
}
