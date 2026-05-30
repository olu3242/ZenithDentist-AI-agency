import { NextRequest, NextResponse } from "next/server";
import { getRevenueRecoverySummary } from "@/lib/dental-revenue-os/revenue-recovery";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const organizationId = new URL(req.url).searchParams.get("organizationId") ?? "";
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "organizationId is required" }, { status: 400 });
  }
  const data = await getRevenueRecoverySummary(organizationId);
  return NextResponse.json({ ok: true, ...data });
}
