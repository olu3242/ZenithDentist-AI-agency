import { NextResponse } from "next/server";
import { coordinateEnterpriseIntelligence } from "@/lib/alice";
import type { AliceOperationalMode } from "@/lib/database.types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = typeof body.prompt === "string" ? body.prompt : "Coordinate enterprise operational intelligence.";
  const mode = typeof body.mode === "string" ? body.mode as AliceOperationalMode : "enterprise_coordination";
  const response = await coordinateEnterpriseIntelligence(prompt, mode);
  return NextResponse.json(response);
}
