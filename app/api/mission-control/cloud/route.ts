import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId } from "@/lib/tenant/tenant-guards";
import { getOperationalMeshState } from "@/lib/runtime/agent-mesh";
import { getRuntimeDigitalTwinState } from "@/lib/runtime/digital-twin";
import { getExecutiveIntelligenceCloudState, getInfrastructureAwarenessState } from "@/lib/runtime/operational-cloud";
import { getOperationalCognitionState } from "@/lib/runtime/operational-cognition";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const ctx = await withTenantGuard(orgId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;
  const [mesh, cognition, digitalTwin, awareness, executiveCloud] = await Promise.all([
    getOperationalMeshState(),
    getOperationalCognitionState(),
    getRuntimeDigitalTwinState(),
    getInfrastructureAwarenessState(),
    getExecutiveIntelligenceCloudState()
  ]);
  return NextResponse.json({ mesh, cognition, digitalTwin, awareness, executiveCloud });
}
