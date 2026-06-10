import { NextRequest, NextResponse } from "next/server";
import { getTenantData } from "@/lib/data/tenants";
import { runEnterpriseCertification } from "@/lib/evidence/evidence-engine";

function isAuthorized(request: NextRequest): boolean {
  const cookieToken = request.cookies.get("zenith_internal_token")?.value ?? "";
  const headerToken = request.headers.get("x-internal-token") ?? "";
  const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const expected = process.env.ZENITH_INTERNAL_TOKEN;
  const cronSecret = process.env.CRON_SECRET;
  if (expected && (cookieToken === expected || headerToken === expected || bearer === expected)) return true;
  if (cronSecret && bearer === cronSecret) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  const tenant = await getTenantData();
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const result = await runEnterpriseCertification(organizationId, "nightly");
  return NextResponse.json({ ok: true, organizationId, result });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
