import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { publishFunnelEvent } from "@/lib/event-fabric";
import { executeRegisteredAutomation } from "@/lib/automation-os/registry";
import { logger } from "@/lib/logger";
import type { OutreachEventType } from "@/lib/database.types";

export interface DetectionResult {
  detector: string;
  workflowId: string;
  matches: number;
  triggered: boolean;
  error?: string;
}

const INACTIVE_DAYS = 90;
const NO_SHOW_GRACE_HOURS = 2;
const REVIEW_REQUEST_MIN_HOURS = 24;
const REVENUE_LEAK_THRESHOLD = 10_000;

async function trigger(
  detector: string,
  workflowId: string,
  eventType: OutreachEventType,
  matches: number,
  metadata: Record<string, unknown>
): Promise<DetectionResult> {
  if (matches === 0) {
    return { detector, workflowId, matches: 0, triggered: false };
  }
  try {
    await publishFunnelEvent({ eventType, metadata: { ...metadata, matches, detector } });
    await executeRegisteredAutomation(workflowId);
    logger.info("detector_workflow_triggered", { detector, workflowId, matches });
    return { detector, workflowId, matches, triggered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("detector_workflow_failed", { detector, workflowId, error: message });
    return { detector, workflowId, matches, triggered: false, error: message };
  }
}

/** recall.due — recall_tracking rows overdue and not yet recovered or contacted recently. */
export async function detectRecallDue(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) return { detector: "recall_due", workflowId: "recall_due", matches: 0, triggered: false, error: "supabase_unavailable" };

  const { data, error } = await (supabase as any)
    .from("recall_tracking")
    .select("id, patient_external_id, months_overdue")
    .eq("status", "overdue")
    .gt("months_overdue", 0)
    .limit(500);
  if (error) return { detector: "recall_due", workflowId: "recall_due", matches: 0, triggered: false, error: error.message };

  return trigger("recall_due", "recall_due", "recall_due_detected", data?.length ?? 0, {
    sample: (data ?? []).slice(0, 5).map((r: { id: string }) => r.id)
  });
}

/** patient.inactive — leads with no activity beyond the inactivity window and no booking. */
export async function detectInactivePatients(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) return { detector: "patient_inactive", workflowId: "stale_patient_detected", matches: 0, triggered: false, error: "supabase_unavailable" };

  const cutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await (supabase as any)
    .from("leads")
    .select("id, created_at, status")
    .lt("created_at", cutoff)
    .not("status", "in", "(booked,won,closed)")
    .limit(500);
  if (error) return { detector: "patient_inactive", workflowId: "stale_patient_detected", matches: 0, triggered: false, error: error.message };

  return trigger("patient_inactive", "stale_patient_detected", "patient_inactive_detected", data?.length ?? 0, {
    inactiveDays: INACTIVE_DAYS
  });
}

/** appointment.no_show — bookings whose scheduled time passed without completion or cancellation. */
export async function detectNoShows(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) return { detector: "appointment_no_show", workflowId: "appointment_no_show", matches: 0, triggered: false, error: "supabase_unavailable" };

  const cutoff = new Date(Date.now() - NO_SHOW_GRACE_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await (supabase as any)
    .from("bookings")
    .select("id, lead_id, scheduled_at")
    .eq("booking_status", "scheduled")
    .lt("scheduled_at", cutoff)
    .limit(200);
  if (error) return { detector: "appointment_no_show", workflowId: "appointment_no_show", matches: 0, triggered: false, error: error.message };

  return trigger("appointment_no_show", "appointment_no_show", "no_show_detected", data?.length ?? 0, {
    graceHours: NO_SHOW_GRACE_HOURS
  });
}

/** review.request — completed bookings past the review window with a linked lead. */
export async function detectReviewRequests(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) return { detector: "review_request", workflowId: "review_request_due", matches: 0, triggered: false, error: "supabase_unavailable" };

  const cutoff = new Date(Date.now() - REVIEW_REQUEST_MIN_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await (supabase as any)
    .from("bookings")
    .select("id, lead_id, scheduled_at")
    .eq("booking_status", "completed")
    .lt("scheduled_at", cutoff)
    .not("lead_id", "is", null)
    .limit(200);
  if (error) return { detector: "review_request", workflowId: "review_request_due", matches: 0, triggered: false, error: error.message };

  return trigger("review_request", "review_request_due", "review_request_triggered", data?.length ?? 0, {
    minHoursSinceVisit: REVIEW_REQUEST_MIN_HOURS
  });
}

/** revenue.leak — assessed practices with large unconverted recovery opportunity. */
export async function detectRevenueLeaks(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) return { detector: "revenue_leak", workflowId: "alice_revenue_opportunity_agent", matches: 0, triggered: false, error: "supabase_unavailable" };

  const { data, error } = await (supabase as any)
    .from("roi_calculations")
    .select("id, lead_id, recoverable_revenue, leads!inner(status)")
    .gt("recoverable_revenue", REVENUE_LEAK_THRESHOLD)
    .not("leads.status", "in", "(booked,won,closed)")
    .limit(200);
  if (error) return { detector: "revenue_leak", workflowId: "alice_revenue_opportunity_agent", matches: 0, triggered: false, error: error.message };

  return trigger("revenue_leak", "alice_revenue_opportunity_agent", "revenue_leak_detected", data?.length ?? 0, {
    thresholdUsd: REVENUE_LEAK_THRESHOLD
  });
}

/** Runs every detector; failures in one detector never block the others. */
export async function runAllDetectors(): Promise<DetectionResult[]> {
  const detectors = [
    detectRecallDue,
    detectInactivePatients,
    detectNoShows,
    detectReviewRequests,
    detectRevenueLeaks
  ];
  const results: DetectionResult[] = [];
  for (const detector of detectors) {
    try {
      results.push(await detector());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ detector: detector.name, workflowId: "unknown", matches: 0, triggered: false, error: message });
    }
  }
  return results;
}
