import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export async function escalateIncident(input: { organizationId: string; incidentId: string; assignedTo: string; assignedBy?: string; reason: string }) {
  const supabase = createServiceClient();
  if (!supabase) return { escalated: false, reason: "supabase_unavailable" };
  const client = supabase as any;
  await Promise.all([
    client.from("incident_assignments").insert({ organization_id: input.organizationId, incident_id: input.incidentId, assigned_to: input.assignedTo, assigned_by: input.assignedBy ?? "incident_escalator" }),
    client.from("incident_events").insert({ organization_id: input.organizationId, incident_id: input.incidentId, event_type: "escalated", actor: input.assignedBy ?? "incident_escalator", outcome: input.reason })
  ]);
  return { escalated: true };
}
