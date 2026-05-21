import { NextResponse } from "next/server";
import { getPortalData } from "@/lib/data/operations";
import { buildPredictiveInsights } from "@/lib/health";

export async function GET() {
  const data = await getPortalData();
  return NextResponse.json({ ok: true, forecasts: buildPredictiveInsights(data.metrics) });
}
