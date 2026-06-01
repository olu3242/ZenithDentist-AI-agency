import "server-only";

import { publishEvent } from "@/lib/event-fabric";

// ─── Dental Event Type Constants ──────────────────────────────────────────────

export const REVENUE_RECOVERED = "dental.revenue.recovered";
export const PATIENT_REACTIVATED = "dental.patient.reactivated";
export const RECALL_COMPLETED = "dental.recall.completed";
export const REVIEW_GENERATED = "dental.review.generated";
export const INSURANCE_VERIFIED = "dental.insurance.verified";
export const TREATMENT_ACCEPTED = "dental.treatment.accepted";
export const PRACTICE_HEALTH_CHANGED = "dental.practice.health_changed";

// ─── Publish Dental Event ─────────────────────────────────────────────────────

export async function publishDentalEvent(
  eventType: string,
  organizationId: string,
  payload: Record<string, unknown>
) {
  return publishEvent({
    event_type: eventType,
    event_source: "workflow_os",
    correlation_id: payload["correlation_id"] as string ?? organizationId,
    tenant_id: organizationId,
    workflow_id: payload["workflow_id"] as string ?? "dental_revenue_os",
    priority: "moderate",
    payload: {
      ...payload,
      organization_id: organizationId,
    },
  });
}
