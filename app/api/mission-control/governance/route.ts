import { NextResponse } from "next/server";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { appendAuditEvent, getGovernanceState } from "@/lib/runtime/governance";
import { generateRuntimeForecasts } from "@/lib/runtime/operational-forecasting";
import { buildSimulationCenterState } from "@/lib/runtime/simulation-engine";
import { getTenantIntelligenceState } from "@/lib/runtime/tenant-intelligence";

export async function GET() {
  const [governance, recovery, forecasts, simulations, tenantIntelligence] = await Promise.all([
    getGovernanceState(),
    getAutonomousRecoveryState(),
    generateRuntimeForecasts(),
    buildSimulationCenterState(),
    getTenantIntelligenceState()
  ]);
  return NextResponse.json({ governance, recovery, forecasts, simulations, tenantIntelligence });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const event = await appendAuditEvent({
    eventType: typeof body.eventType === "string" ? body.eventType : "governance_decision",
    title: typeof body.title === "string" ? body.title : "Governance decision recorded",
    description: typeof body.description === "string" ? body.description : "Operator recorded a runtime governance decision.",
    severity: body.severity === "low" || body.severity === "moderate" || body.severity === "high" || body.severity === "critical" ? body.severity : "moderate",
    traceId: typeof body.traceId === "string" ? body.traceId : null,
    correlationId: typeof body.correlationId === "string" ? body.correlationId : null,
    metadata: typeof body.metadata === "object" && body.metadata !== null ? body.metadata : {}
  });
  return NextResponse.json({ event });
}
