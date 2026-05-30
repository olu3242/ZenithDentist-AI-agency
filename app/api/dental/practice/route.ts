import { NextRequest, NextResponse } from "next/server";
import { getPracticeHealthSummary } from "@/lib/dental-revenue-os/practice-health";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const organizationId = new URL(req.url).searchParams.get("organizationId") ?? "";
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "organizationId is required" }, { status: 400 });
  }
  const data = await getPracticeHealthSummary(organizationId);
  return NextResponse.json({ ok: true, ...data });
}
