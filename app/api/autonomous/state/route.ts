import { NextResponse } from "next/server";
import { getAutonomousEngineState } from "@/lib/autonomous";

export async function GET() {
  return NextResponse.json({ ok: true, state: await getAutonomousEngineState() });
}
