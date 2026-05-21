import { NextResponse } from "next/server";
import { getProductizationState } from "@/lib/platform/productization";
import { getRuntimeEventFabricState } from "@/lib/runtime/event-fabric";
import { getRecoveryOrchestratorState } from "@/lib/runtime/recovery-orchestrator";

export async function GET() {
  const [productization, eventFabric, recoveryOrchestrator] = await Promise.all([
    getProductizationState(),
    getRuntimeEventFabricState(),
    getRecoveryOrchestratorState()
  ]);
  return NextResponse.json({ productization, eventFabric, recoveryOrchestrator });
}
