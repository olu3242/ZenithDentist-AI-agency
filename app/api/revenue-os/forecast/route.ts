import { NextResponse } from "next/server";
import { forecastRevenue } from "@/lib/revenue-os";
import { createServiceClient } from "@/lib/supabase/server";

function getOrganizationId(request: Request): string | null {
  const orgId = request.headers.get("x-organization-id");
  if (orgId) return orgId;
  const { searchParams } = new URL(request.url);
  return searchParams.get("organizationId");
}

export async function GET(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json(
      { ok: false, error: "Missing organizationId" },
      { status: 400 }
    );
  }
  const { searchParams } = new URL(request.url);
  const horizonDaysParam = searchParams.get("horizonDays");
  const horizonDays: 30 | 60 | 90 | 180 | 365 = [
    30, 60, 90, 180, 365,
  ].includes(Number(horizonDaysParam))
    ? (Number(horizonDaysParam) as 30 | 60 | 90 | 180 | 365)
    : 30;

  try {
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await (supabase as any)
        .from("revenue_forecasts")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("horizon_days", horizonDays)
        .eq("forecast_type", "total")
        .order("forecast_date", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const row = data[0];
        const forecast = {
          organizationId: row.organization_id as string,
          forecastDate: row.forecast_date as string,
          horizonDays: Number(row.horizon_days) as 30 | 60 | 90 | 180 | 365,
          forecastType: row.forecast_type as string,
          forecastedAmount: Number(row.forecasted_amount ?? 0),
          confidenceLow: Number(row.confidence_low ?? 0),
          confidenceHigh: Number(row.confidence_high ?? 0),
        };
        return NextResponse.json({ ok: true, forecast });
      }
    }
    // No cached forecast found — generate one
    const forecast = await forecastRevenue(organizationId, horizonDays);
    return NextResponse.json({ ok: true, forecast });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json(
      { ok: false, error: "Missing organizationId" },
      { status: 400 }
    );
  }
  const body = await request.json().catch(() => ({}));
  const horizonDays: 30 | 60 | 90 | 180 | 365 = [
    30, 60, 90, 180, 365,
  ].includes(Number(body.horizonDays))
    ? (Number(body.horizonDays) as 30 | 60 | 90 | 180 | 365)
    : 30;
  try {
    const forecast = await forecastRevenue(organizationId, horizonDays);
    return NextResponse.json({ ok: true, forecast });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
