import { NextResponse } from "next/server";
import { getAutonomousPlaybooks } from "@/lib/autonomous";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function GET() {
  const supabase = createServiceClient();

  // Primary path: live ALICE recommendations from the database
  if (supabase) {
    const { data, error } = await (supabase as any)
      .from("alice_recommendations")
      .select("id, title, recommendation, expected_impact, confidence, priority, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      logger.warn("alice_recommendations_query_failed", { error: error.message });
    } else if (data && data.length > 0) {
      return NextResponse.json({
        ok: true,
        source: "alice_recommendations",
        recommendations: data.map((row: any) => ({
          id: row.id,
          title: row.title,
          recommendation: row.recommendation,
          expectedImprovement: row.expected_impact,
          confidence: row.confidence,
          priority: row.priority,
          status: row.status,
          createdAt: row.created_at
        }))
      });
    }
  }

  // Fallback: curated playbooks when no live recommendations exist yet
  const recommendations = getAutonomousPlaybooks().map(playbook => ({
    title: playbook.name,
    recommendation: playbook.recommendedActions[0],
    expectedImprovement: playbook.expectedOutcomes,
    confidence: playbook.confidence
  }));

  return NextResponse.json({ ok: true, source: "playbook_library", recommendations });
}
