import { NextResponse } from "next/server";
import { getPortalData } from "@/lib/data/operations";
import { buildPredictiveInsights } from "@/lib/health";
import { getTenantData } from "@/lib/data/tenants";

export async function GET() {
  const tenantData = await getTenantData();
  const data = await getPortalData(tenantData.tenant.organizationId ?? undefined);
  return NextResponse.json({ ok: true, forecasts: buildPredictiveInsights(data.metrics) });
}
