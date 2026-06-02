import { NextResponse } from "next/server";
import {
  getRevenueSummary,
  getOpenOpportunities,
  scanRevenueOpportunities,
  forecastRevenue,
} from "@/lib/revenue-os";

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
  try {
    const [summary, opportunities] = await Promise.all([
      getRevenueSummary(organizationId),
      getOpenOpportunities(organizationId),
    ]);
    return NextResponse.json({ ok: true, summary, opportunities });
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
  const action: string = body.action ?? "";
  try {
    if (action === "scan_opportunities") {
      const opportunities = await scanRevenueOpportunities(organizationId);
      return NextResponse.json({ ok: true, opportunities });
    }
    if (action === "forecast") {
      const horizonDays: 30 | 60 | 90 | 180 | 365 = [
        30, 60, 90, 180, 365,
      ].includes(Number(body.horizonDays))
        ? (Number(body.horizonDays) as 30 | 60 | 90 | 180 | 365)
        : 30;
      const forecast = await forecastRevenue(organizationId, horizonDays);
      return NextResponse.json({ ok: true, forecast });
    }
    return NextResponse.json(
      { ok: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
