import { NextResponse } from "next/server";
import { runEnterpriseSimulation } from "@/lib/enterprise-cloud";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = await runEnterpriseSimulation(body);
  return NextResponse.json(result);
}
