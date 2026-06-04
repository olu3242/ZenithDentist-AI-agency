import { NextResponse } from "next/server";
import {
  getProviderLeaderboard,
  snapshotProviderPerformance,
} from "@/lib/revenue-os/provider-performance";

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
    const leaderboard = await getProviderLeaderboard(organizationId);
    return NextResponse.json({ ok: true, leaderboard });
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
  const providerExternalId: string | undefined = body.providerExternalId;
  if (!providerExternalId) {
    return NextResponse.json(
      { ok: false, error: "Missing providerExternalId" },
      { status: 400 }
    );
  }
  try {
    const snapshot = await snapshotProviderPerformance(
      organizationId,
      providerExternalId
    );
    return NextResponse.json({ ok: true, snapshot });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
