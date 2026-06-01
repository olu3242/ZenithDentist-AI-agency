import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { provisionOrganization } from "@/lib/tenant/organization-provisioning";

export async function POST(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId);
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "organization_owner")) {
    return NextResponse.json({ ok: false, error: "Organization owner role required." }, { status: 403 });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const result = await provisionOrganization({
      organizationId: ctx.organizationId,
      organizationSlug: ctx.organizationSlug,
      organizationName: String(body.name ?? ""),
      ownerUserId: ctx.userId ?? "",
      ownerEmail: ctx.userEmail ?? "",
      planKey: String(body.planKey ?? "starter"),
    });
    return NextResponse.json({ ok: result.success, data: result });
  } catch {
    return NextResponse.json({ ok: false, error: "Provisioning failed." }, { status: 500 });
  }
}
