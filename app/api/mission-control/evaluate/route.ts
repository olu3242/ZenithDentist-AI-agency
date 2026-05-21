import { NextResponse } from "next/server";
import { evaluateIntelligenceGrounding } from "@/lib/stability";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = typeof body.prompt === "string" ? body.prompt : "Evaluate operational grounding.";
  const evaluation = await evaluateIntelligenceGrounding(prompt);
  return NextResponse.json(evaluation);
}
