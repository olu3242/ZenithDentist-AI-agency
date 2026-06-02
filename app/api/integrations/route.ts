import { NextResponse } from "next/server";
import {
  getInstalledIntegrations,
  getIntegrationRegistry,
  installIntegration,
} from "@/lib/integration-os";

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

  try {
    const [installed, registry] = await Promise.all([
      getInstalledIntegrations(organizationId),
      getIntegrationRegistry(),
    ]);

    return NextResponse.json({ ok: true, installed, registry });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const organizationId = getOrganizationId(request);
  if (!organizationId) {
    return NextResponse.json({ ok: false, error: "Missing organizationId" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { integrationKey, config } = body as { integrationKey: string; config?: Record<string, unknown> };

    if (!integrationKey) {
      return NextResponse.json({ ok: false, error: "Missing integrationKey" }, { status: 400 });
    }

    const result = await installIntegration(organizationId, integrationKey, config);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
