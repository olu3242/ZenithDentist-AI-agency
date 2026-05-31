import { NextRequest, NextResponse } from "next/server";
import { withTenantGuard, extractOrgId } from "@/lib/tenant/tenant-guards";
import { getProductizationState } from "@/lib/platform/productization";
import { getRuntimeEventFabricState } from "@/lib/runtime/event-fabric";
import { getRecoveryOrchestratorState } from "@/lib/runtime/recovery-orchestrator";

export async function GET(req: NextRequest) {
  const orgId = extractOrgId(req);
  const ctx = await withTenantGuard(orgId).catch(() =>
    NextResponse.json({ ok: false, error: "Tenant resolution failed" }, { status: 403 })
  );
  if (ctx instanceof NextResponse) return ctx;
  const [productization, eventFabric, recoveryOrchestrator] = await Promise.all([
    getProductizationState(),
    getRuntimeEventFabricState(),
    getRecoveryOrchestratorState()
  ]);
  return NextResponse.json({ productization, eventFabric, recoveryOrchestrator });
}
