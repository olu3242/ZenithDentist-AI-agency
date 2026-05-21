import { NextResponse } from "next/server";
import { getOperationalMeshState } from "@/lib/runtime/agent-mesh";
import { getRuntimeDigitalTwinState } from "@/lib/runtime/digital-twin";
import { getExecutiveIntelligenceCloudState, getInfrastructureAwarenessState } from "@/lib/runtime/operational-cloud";
import { getOperationalCognitionState } from "@/lib/runtime/operational-cognition";

export async function GET() {
  const [mesh, cognition, digitalTwin, awareness, executiveCloud] = await Promise.all([
    getOperationalMeshState(),
    getOperationalCognitionState(),
    getRuntimeDigitalTwinState(),
    getInfrastructureAwarenessState(),
    getExecutiveIntelligenceCloudState()
  ]);
  return NextResponse.json({ mesh, cognition, digitalTwin, awareness, executiveCloud });
}
