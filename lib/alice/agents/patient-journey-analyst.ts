import "server-only";

import { getIntelligenceProvider } from "@/lib/ai/provider";
import { createServiceClient } from "@/lib/supabase/server";

export interface PatientJourneyReport {
  organizationId: string;
  generatedAt: string;
  conversionFunnelHealth: number;
  dropOffPoints: Array<{ stage: string; dropOffRate: number; recommendation: string }>;
  recallHealth: number;
  retentionRate: number;
  rawInsight: string;
}

async function fetchJourneyData(organizationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return { recallEvents: [], recoveryEvents: [] };

  const windowStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [recallResult, recoveryResult] = await Promise.all([
    (supabase as ReturnType<typeof createServiceClient> & {
      from: (t: string) => {
        select: (c: string) => {
          eq: (col: string, val: string) => {
            gte: (col: string, val: string) => {
              limit: (n: number) => Promise<{ data: unknown[] | null }>;
            };
          };
        };
      };
    })
      .from("recall_recovery_events")
      .select("status, contacted_at, responded_at, scheduled_at")
      .eq("organization_id", organizationId)
      .gte("contacted_at", windowStart)
      .limit(500),
    (supabase as ReturnType<typeof createServiceClient> & {
      from: (t: string) => {
        select: (c: string) => {
          eq: (col: string, val: string) => {
            gte: (col: string, val: string) => {
              limit: (n: number) => Promise<{ data: unknown[] | null }>;
            };
          };
        };
      };
    })
      .from("revenue_recovery_events")
      .select("recovery_type, status, recovery_amount")
      .eq("organization_id", organizationId)
      .gte("created_at", windowStart)
      .limit(500)
  ]);

  return {
    recallEvents: recallResult.data ?? [],
    recoveryEvents: recoveryResult.data ?? []
  };
}

export async function generatePatientJourneyAnalysis(organizationId: string): Promise<PatientJourneyReport> {
  const journeyData = await fetchJourneyData(organizationId);
  const provider = getIntelligenceProvider();

  const systemPrompt = `You are a patient journey analyst for a dental Patient Revenue Operating System.
You evaluate patient lifecycle health: funnel conversion, recall compliance, drop-off points, and retention.
Respond ONLY with valid JSON with keys:
- conversionFunnelHealth: number 0-100
- recallHealth: number 0-100
- retentionRate: number 0-100 (% of active patients retained year-over-year)
- dropOffPoints: array of { stage, dropOffRate (0-1), recommendation }`;

  const contextPrompt = `Organization: ${organizationId}
Recall events (90-day window): ${journeyData.recallEvents.length}
Recovery events: ${journeyData.recoveryEvents.length}

Patient journey stages to evaluate:
1. New Patient → First Appointment (conversion)
2. First Visit → Treatment Plan (treatment acceptance)
3. Treatment Plan → Scheduled (scheduling conversion)
4. Recall Due → Contacted (recall outreach reach)
5. Contacted → Scheduled (recall booking conversion)
6. Active → Retained (12-month retention)

Common dental industry benchmarks:
- Recall compliance: 68-75% (top performers >80%)
- Treatment acceptance: 60-70%
- New patient → booked: 75-85%
- 12-month retention: 70-80%

Analyze the patient journey health for this practice.`;

  const result = await provider.complete({
    system: systemPrompt,
    prompt: contextPrompt,
    context: { organizationId, recallEventCount: journeyData.recallEvents.length, recoveryEventCount: journeyData.recoveryEvents.length }
  });

  const defaultDropOffPoints = [
    { stage: "Recall Due → Contacted", dropOffRate: 0.32, recommendation: "Increase recall outreach frequency and add SMS channel for patients not responding to email" },
    { stage: "Contacted → Scheduled", dropOffRate: 0.28, recommendation: "Add one-click scheduling link to recall messages to reduce friction" },
    { stage: "Treatment Plan → Scheduled", dropOffRate: 0.38, recommendation: "Activate 72-hour treatment follow-up sequence with financing options" }
  ];

  let conversionFunnelHealth = 72;
  let dropOffPoints = defaultDropOffPoints;
  let recallHealth = 68;
  let retentionRate = 74;

  try {
    const parsed = JSON.parse(result.content) as {
      conversionFunnelHealth?: number;
      recallHealth?: number;
      retentionRate?: number;
      dropOffPoints?: typeof defaultDropOffPoints;
    };
    if (typeof parsed.conversionFunnelHealth === "number") conversionFunnelHealth = parsed.conversionFunnelHealth;
    if (typeof parsed.recallHealth === "number") recallHealth = parsed.recallHealth;
    if (typeof parsed.retentionRate === "number") retentionRate = parsed.retentionRate;
    if (Array.isArray(parsed.dropOffPoints) && parsed.dropOffPoints.length > 0) dropOffPoints = parsed.dropOffPoints;
  } catch {
    // Use defaults
  }

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    conversionFunnelHealth,
    dropOffPoints,
    recallHealth,
    retentionRate,
    rawInsight: result.content
  };
}
