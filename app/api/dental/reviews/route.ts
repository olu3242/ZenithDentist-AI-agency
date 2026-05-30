import { NextRequest, NextResponse } from "next/server";
import { getReviewGrowthMetrics } from "@/lib/dental-revenue-os/review-growth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const organizationId = new URL(req.url).searchParams.get("organizationId") ?? "";
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "organizationId is required" }, { status: 400 });
  }
  const data = await getReviewGrowthMetrics(organizationId);
  return NextResponse.json({ ok: true, ...data });
}
