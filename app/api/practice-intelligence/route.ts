import { NextResponse } from "next/server";
import {
  generateIntelligenceSnapshot,
  getIntelligenceSnapshot,
} from "@/lib/practice-intelligence";

function getOrganizationId(request: Request): string | null {
  const orgId = request.headers.get("x-organization-id");
  if (orgId) return orgId;
  const { searchParams } = new URL(request.url);
  return searchParams.get("organizationId");
}

export async function GET(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const snapshotType = searchParams.get("type") ?? "daily";
  try {
    const snapshot = await getIntelligenceSnapshot(organizationId, snapshotType);
    return NextResponse.json({ ok: true, snapshot });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  const snapshotType: "daily" | "weekly" | "monthly" =
    body.snapshotType === "weekly" || body.snapshotType === "monthly"
      ? body.snapshotType
      : "daily";
  try {
    const snapshot = await generateIntelligenceSnapshot(organizationId, snapshotType);
    return NextResponse.json({ ok: true, snapshot });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
