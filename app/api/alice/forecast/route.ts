import { NextResponse } from "next/server";
import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { buildPredictiveInsights } from "@/lib/health";

export async function GET() {
  const { tenant } = await getTenantData();
  const data = await getPortalData(tenant.organizationId);
  return NextResponse.json({ ok: true, forecasts: buildPredictiveInsights(data.metrics) });
}
