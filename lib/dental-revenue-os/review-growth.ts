import "server-only";

import { executeWorkflow } from "@/lib/workflow-os/workflow-engine";
import { createServiceClient } from "@/lib/supabase/server";

export interface VisitData {
  patientId: string;
  visitDate?: string;
  platform?: string;
  providerName?: string;
  metadata?: Record<string, unknown>;
}

export async function triggerReviewRequest(
  organizationId: string,
  visitData: VisitData
) {
  return executeWorkflow({
    workflowId: "review_request_due",
    organizationId,
    triggerName: "review_request_due",
    actionName: "send_review_request",
    payload: {
      patient_id: visitData.patientId,
      visit_date: visitData.visitDate,
      platform: visitData.platform,
      provider_name: visitData.providerName,
      ...(visitData.metadata ?? {}),
    },
    initiatedBy: "system",
  });
}

export async function getReviewGrowthMetrics(organizationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return { events: [], total: 0, converted: 0, avgRating: null };

  const { data, error } = await supabase
    .from("review_growth_events")
    .select("id, platform, converted, star_rating, request_sent_at, review_received_at, created_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) return { events: [], total: 0, converted: 0, avgRating: null };

  const converted = data.filter(
    (row) => (row as Record<string, unknown>)["converted"] === true
  ).length;

  const ratings = data
    .map((row) => (row as Record<string, unknown>)["star_rating"] as number | null)
    .filter((r): r is number => r !== null);

  const avgRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : null;

  return { events: data, total: data.length, converted, avgRating };
}
