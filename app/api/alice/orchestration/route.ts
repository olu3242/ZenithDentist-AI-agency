import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId, extractUserId } from "@/lib/tenant/tenant-guards";
import { coordinateEnterpriseIntelligence } from "@/lib/alice";
import type { AliceOperationalMode } from "@/lib/database.types";

export async function POST(req: NextRequest) {
  const orgId = extractOrgId(req);
  const userId = extractUserId(req);
  const ctx = await withTenantGuard(orgId, userId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json().catch(() => ({}));
  const prompt = typeof body.prompt === "string" ? body.prompt : "Coordinate enterprise operational intelligence.";
  const mode = typeof body.mode === "string" ? body.mode as AliceOperationalMode : "enterprise_coordination";
  const response = await coordinateEnterpriseIntelligence(prompt, mode);
  return NextResponse.json(response);
}
