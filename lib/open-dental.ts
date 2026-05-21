import type { Json } from "@/lib/database.types";
import { normalizePMSPayload } from "@/lib/pms";

export type OpenDentalEntityType =
  | "appointment"
  | "cancellation"
  | "recall"
  | "provider_schedule"
  | "patient_engagement"
  | "hygiene_utilization"
  | "scheduling_metric";

export interface OpenDentalRecord {
  remoteId: string;
  entityType: OpenDentalEntityType;
  occurredAt: string;
  patientRef?: string;
  providerRef?: string;
  appointmentRef?: string;
  productionValue?: number;
  noShowRisk?: number;
  recallAgeDays?: number;
  hygieneUtilization?: number;
  confirmationRate?: number;
  daypart?: string;
}

export interface OpenDentalSyncResult {
  sourceSystem: "open_dental";
  sourceEventId: string;
  normalizedEventType: "operational_events" | "scheduling_events" | "retention_events" | "engagement_events" | "forecast_events";
  idempotencyKey: string;
  correlationId: string;
  payload: Json;
  lineage: Json;
}

export function normalizeOpenDentalRecord(record: OpenDentalRecord, organizationId: string, locationId: string | null): OpenDentalSyncResult {
  const eventType = mapOpenDentalEventType(record.entityType);
  const normalized = normalizePMSPayload("open_dental", {
    eventType,
    occurredAt: record.occurredAt,
    patientRef: record.patientRef,
    providerRef: record.providerRef,
    appointmentRef: record.appointmentRef,
    productionValue: record.productionValue,
    noShowRisk: record.noShowRisk,
    recallAgeDays: record.recallAgeDays,
    hygieneUtilization: record.hygieneUtilization,
    confirmationRate: record.confirmationRate,
    daypart: record.daypart
  });
  const idempotencyKey = buildOpenDentalIdempotencyKey(organizationId, record.remoteId, eventType);
  const correlationId = pseudoUuid(idempotencyKey);

  return {
    sourceSystem: "open_dental",
    sourceEventId: record.remoteId,
    normalizedEventType: eventType,
    idempotencyKey,
    correlationId,
    payload: {
      organization_id: organizationId,
      location_id: locationId,
      ...normalized,
      source_remote_id: record.remoteId
    },
    lineage: [
      { step: "open_dental_ingest", at: record.occurredAt, sourceId: record.remoteId },
      { step: "normalized_sync_layer", at: new Date().toISOString(), eventType },
      { step: "queue_ready", at: new Date().toISOString(), idempotencyKey }
    ]
  };
}

export function reconcileOpenDentalBatch(records: OpenDentalRecord[]) {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const accepted: OpenDentalRecord[] = [];

  for (const record of records) {
    const key = `${record.entityType}:${record.remoteId}`;
    if (seen.has(key)) {
      duplicates.push(key);
    } else {
      seen.add(key);
      accepted.push(record);
    }
  }

  return {
    accepted,
    duplicates,
    reconciliationHash: simpleHash(accepted.map(record => `${record.entityType}:${record.remoteId}:${record.occurredAt}`).join("|"))
  };
}

export function pilotOpenDentalRecords(): OpenDentalRecord[] {
  return [];
}

function mapOpenDentalEventType(entityType: OpenDentalEntityType): OpenDentalSyncResult["normalizedEventType"] {
  if (entityType === "appointment" || entityType === "provider_schedule" || entityType === "scheduling_metric") return "scheduling_events";
  if (entityType === "cancellation") return "forecast_events";
  if (entityType === "recall") return "retention_events";
  if (entityType === "patient_engagement" || entityType === "hygiene_utilization") return "engagement_events";
  return "operational_events";
}

function buildOpenDentalIdempotencyKey(organizationId: string, remoteId: string, eventType: string) {
  return `open_dental:${organizationId}:${eventType}:${remoteId}`;
}

function simpleHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index) | 0;
  }
  return Math.abs(hash).toString(16);
}

function pseudoUuid(seed: string) {
  const hash = simpleHash(seed).padStart(8, "0").slice(0, 8);
  return `${hash}-0000-4000-8000-${hash}${hash}`.slice(0, 36);
}
