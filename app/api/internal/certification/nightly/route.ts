import { NextResponse } from "next/server";
import { getTenantData } from "@/lib/data/tenants";
import { runEnterpriseCertification } from "@/lib/evidence/evidence-engine";

export async function GET() {
  const tenant = await getTenantData();
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const result = await runEnterpriseCertification(organizationId, "nightly");
  return NextResponse.json({ ok: true, organizationId, result });
}

export async function POST() {
  return GET();
}
