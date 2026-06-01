import { NextResponse } from "next/server";
import { getAgentWorkforceState } from "@/lib/agent-workforce";

export async function GET() {
  return NextResponse.json({ ok: true, workforce: getAgentWorkforceState() });
}
