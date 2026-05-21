import { NextResponse } from "next/server";
import { getAutonomousPlaybooks } from "@/lib/autonomous";

export async function GET() {
  const recommendations = getAutonomousPlaybooks().map(playbook => ({
    title: playbook.name,
    recommendation: playbook.recommendedActions[0],
    expectedImprovement: playbook.expectedOutcomes,
    confidence: playbook.confidence
  }));

  return NextResponse.json({ ok: true, recommendations });
}
