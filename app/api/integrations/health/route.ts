import { NextResponse } from "next/server";
import { getInstalledIntegrations, checkIntegrationHealth } from "@/lib/integration-os";

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
    const installed = await getInstalledIntegrations(organizationId);

    const healthChecks = await Promise.all(
      installed.map(async (integration) => {
        const health = await checkIntegrationHealth(organizationId, integration.integrationKey);
        return {
          integrationKey: integration.integrationKey,
          ...health,
        };
      })
    );

    return NextResponse.json({ ok: true, health: healthChecks });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
