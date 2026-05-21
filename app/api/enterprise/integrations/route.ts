import { NextResponse } from "next/server";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";
import { normalizePMSPayload } from "@/lib/pms";
import type { PMSProviderKey } from "@/lib/database.types";

export async function GET() {
  const state = await getEnterpriseCloudState();
  return NextResponse.json({
    integrations: state.integrations,
    providerCoverage: state.providerCoverage
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const provider = (typeof body.provider === "string" ? body.provider : "open_dental") as PMSProviderKey;
  const normalized = normalizePMSPayload(provider, body.payload ?? {});
  return NextResponse.json({ normalized, status: "accepted" });
}
