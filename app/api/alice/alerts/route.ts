import { NextResponse } from "next/server";
import { getAutonomousEngineState } from "@/lib/autonomous";

export async function GET() {
  const state = await getAutonomousEngineState();
  return NextResponse.json({
    ok: true,
    alerts: state.timeline.filter(item => item.severity === "warning" || item.severity === "critical")
  });
}
