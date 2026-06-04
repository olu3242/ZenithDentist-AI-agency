import "server-only";

import type { Json } from "@/lib/database.types";
import { produceEvidence } from "@/lib/evidence/evidence-producer";
import type { IncidentSignal } from "@/lib/incidents/incident-detector";
import { createServiceClient } from "@/lib/supabase/server";

export async function openIncident(organizationId: string, signal: IncidentSignal) {
  const supabase = createServiceClient();
  if (!supabase) return { persisted: false, reason: "supabase_unavailable" };
  const client = supabase as any;
  const { data, error } = await client.from("incidents").insert({
    organization_id: organizationId,
    severity: signal.severity,
    title: signal.title,
    summary: signal.summary,
    source: signal.type,
    trace_id: signal.traceId,
    metadata: (signal.metadata ?? {}) as Json
  }).select("id").single();
  if (error || !data?.id) return { persisted: false, reason: error?.message ?? "incident_missing" };
  await Promise.all([
    client.from("incident_events").insert({ organization_id: organizationId, incident_id: data.id, event_type: "opened", outcome: "incident_created", trace_id: signal.traceId }),
    client.from("incident_timelines").insert({ organization_id: organizationId, incident_id: data.id, label: "Incident opened", detail: signal.summary, actor: "incident_engine" }),
    produceEvidence({ type: "INCIDENT_EVENT", organizationId, traceId: signal.traceId, actor: "incident_engine", source: signal.type, action: "incident_opened", reason: signal.summary, outcome: "open", metadata: { incident_id: data.id } })
  ]);
  return { persisted: true, incidentId: data.id };
}
