import { NextResponse } from "next/server";
import { generateAliceInsights } from "@/lib/alice";

export async function GET() {
  return NextResponse.json({ ok: true, insights: await generateAliceInsights() });
}
