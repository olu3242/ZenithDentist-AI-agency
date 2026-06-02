import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { handleLizBriefing } from "@/lib/liz/api-handler";

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
    const result = await handleLizBriefing(ctx.organizationId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[LIZ] briefing error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to generate LIZ briefing." },
      { status: 500 }
    );
  }
}
