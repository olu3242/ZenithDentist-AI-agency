import type { PMSProviderKey, Json } from "@/lib/database.types";

export interface NormalizedHealthcareEvent {
  eventType: string;
  occurredAt: string;
  patientRef?: string;
  providerRef?: string;
  appointmentRef?: string;
  normalizedPayload: Record<string, unknown>;
  forecastFeatures: Record<string, number | string | boolean>;
  benchmarkFeatures: Record<string, number | string | boolean>;
}

export interface PMSAdapter {
  provider: PMSProviderKey;
  displayName: string;
  normalize(input: Record<string, unknown>): NormalizedHealthcareEvent;
}

function normalizeCommon(provider: PMSProviderKey, input: Record<string, unknown>): NormalizedHealthcareEvent {
  const eventType = String(input.eventType ?? input.type ?? "appointment_updated");
  const occurredAt = String(input.occurredAt ?? input.date ?? new Date().toISOString());
  const noShowRisk = Number(input.noShowRisk ?? input.no_show_risk ?? 0.18);
  const productionValue = Number(input.productionValue ?? input.production_value ?? 420);

  return {
    eventType,
    occurredAt,
    patientRef: input.patientRef ? String(input.patientRef) : undefined,
    providerRef: input.providerRef ? String(input.providerRef) : undefined,
    appointmentRef: input.appointmentRef ? String(input.appointmentRef) : undefined,
    normalizedPayload: {
      provider,
      eventType,
      productionValue,
      chairMinutes: Number(input.chairMinutes ?? 60),
      retentionSignal: Number(input.retentionSignal ?? 0.72)
    },
    forecastFeatures: {
      noShowRisk,
      productionValue,
      daypart: String(input.daypart ?? "afternoon"),
      recallAgeDays: Number(input.recallAgeDays ?? 145)
    },
    benchmarkFeatures: {
      productionValue,
      hygieneUtilization: Number(input.hygieneUtilization ?? 0.81),
      confirmationRate: Number(input.confirmationRate ?? 0.9)
    }
  };
}

const adapters: Record<PMSProviderKey, PMSAdapter> = {
  dentrix: { provider: "dentrix", displayName: "Dentrix", normalize: input => normalizeCommon("dentrix", input) },
  eaglesoft: { provider: "eaglesoft", displayName: "Eaglesoft", normalize: input => normalizeCommon("eaglesoft", input) },
  open_dental: { provider: "open_dental", displayName: "Open Dental", normalize: input => normalizeCommon("open_dental", input) },
  carestream: { provider: "carestream", displayName: "Carestream", normalize: input => normalizeCommon("carestream", input) },
  future_provider: { provider: "future_provider", displayName: "Future PMS Provider", normalize: input => normalizeCommon("future_provider", input) }
};

export function getPMSAdapter(provider: PMSProviderKey): PMSAdapter {
  return adapters[provider];
}

export function normalizePMSPayload(provider: PMSProviderKey, input: Record<string, unknown>) {
  const normalized = getPMSAdapter(provider).normalize(input);
  return {
    source_provider: provider,
    event_type: normalized.eventType,
    occurred_at: normalized.occurredAt,
    patient_ref: normalized.patientRef ?? null,
    provider_ref: normalized.providerRef ?? null,
    appointment_ref: normalized.appointmentRef ?? null,
    normalized_payload: normalized.normalizedPayload as Json,
    forecast_features: normalized.forecastFeatures as Json,
    benchmark_features: normalized.benchmarkFeatures as Json
  };
}

export function getSupportedPMSProviders() {
  return Object.values(adapters).map(adapter => ({
    provider: adapter.provider,
    displayName: adapter.displayName
  }));
}
