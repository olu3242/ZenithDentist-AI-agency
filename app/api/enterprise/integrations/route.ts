import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId } from "@/lib/tenant/tenant-guards";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";
import { normalizePMSPayload } from "@/lib/pms";
import type { PMSProviderKey } from "@/lib/database.types";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const ctx = await withTenantGuard(orgId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const state = await getEnterpriseCloudState();
  return NextResponse.json({
    integrations: state.integrations,
    providerCoverage: state.providerCoverage
  });
}

export async function POST(req: NextRequest) {
  const orgId = extractOrgId(req);
  const ctx = await withTenantGuard(orgId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json().catch(() => ({}));
  const provider = (typeof body.provider === "string" ? body.provider : "open_dental") as PMSProviderKey;
  const normalized = normalizePMSPayload(provider, body.payload ?? {});
  return NextResponse.json({ normalized, status: "accepted" });
}
