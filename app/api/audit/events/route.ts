import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { getAuditLog, getAuditSummary } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId);
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "practice_manager")) {
    return NextResponse.json({ ok: false, error: "Insufficient role." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const summary = searchParams.get("summary") === "true";

  try {
    if (summary) {
      const data = await getAuditSummary(ctx.organizationId);
      return NextResponse.json({ ok: true, data });
    }

    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    const eventType = searchParams.get("eventType") ?? undefined;
    const since = searchParams.get("since") ?? undefined;

    const data = await getAuditLog(ctx.organizationId, { limit, offset, eventType, since });
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to retrieve audit log." }, { status: 500 });
  }
}
