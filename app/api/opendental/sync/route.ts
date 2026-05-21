import { NextResponse } from "next/server";
import { runOpenDentalPilotSync } from "@/lib/stability";
import { completeRuntimeTrace, failRuntimeTrace, startRuntimeTrace } from "@/lib/runtime/instrumentation";

export async function POST() {
  const trace = await startRuntimeTrace({ workflowId: "recall_due", eventName: "open_dental_pilot_sync" });
  try {
    const result = await runOpenDentalPilotSync();
    await completeRuntimeTrace(trace);
    return NextResponse.json(result);
  } catch (error) {
    await failRuntimeTrace(trace, error instanceof Error ? error.message : "Open Dental pilot sync failed");
    throw error;
  }
}
