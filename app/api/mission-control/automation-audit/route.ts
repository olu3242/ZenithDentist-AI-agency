import { NextResponse } from "next/server";
import { getAutomationAuditState } from "@/lib/automation-audit";

export async function GET() {
  const state = await getAutomationAuditState();
  return NextResponse.json(state);
}
