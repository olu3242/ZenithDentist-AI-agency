import { NextResponse } from "next/server";
import { getRevenueOrchestrationState } from "@/lib/enterprise-cloud";

export async function GET() {
  const state = await getRevenueOrchestrationState();
  return NextResponse.json(state);
}
