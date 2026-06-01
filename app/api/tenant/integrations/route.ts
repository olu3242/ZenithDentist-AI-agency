import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { roleAtLeast } from "@/lib/rbac/roles";
import { getTenantIntegrations, upsertIntegration, INTEGRATION_REGISTRY, type IntegrationKey } from "@/lib/tenant/integration-registry";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId);
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "read_only")) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const integrations = await getTenantIntegrations(ctx.organizationId);
    const registry = Object.values(INTEGRATION_REGISTRY);
    return NextResponse.json({ ok: true, data: { integrations, registry } });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to load integrations." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId);
  if (ctx instanceof NextResponse) return ctx;

  if (!roleAtLeast(ctx.membershipRole, "practice_manager")) {
    return NextResponse.json({ ok: false, error: "Practice manager role required." }, { status: 403 });
  }

  try {
    const body = await req.json() as Record<string, unknown>;
    const integrationKey = body.integrationKey as IntegrationKey;
    const config = (body.config as Record<string, unknown>) ?? {};
    const result = await upsertIntegration(ctx.organizationId, integrationKey, config);
    return NextResponse.json({ ok: result.success, data: result });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to save integration." }, { status: 500 });
  }
}
