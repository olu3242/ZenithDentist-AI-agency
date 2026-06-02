import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type JourneyType =
  | 'new_patient'
  | 'appointment_prep'
  | 'treatment_education'
  | 'treatment_acceptance'
  | 'post_treatment'
  | 'review_request'
  | 'referral'
  | 'membership'
  | 'recall'
  | 'financing'
  | 'emergency'
  | 'reactivation'
  | 'vip'
  | 'family';

export interface JourneyDefinition {
  id: string;
  organizationId: string;
  journeyName: string;
  journeyType: JourneyType;
  description: string | null;
  status: string;
  stepCount: number;
}

export async function getJourneyLibrary(organizationId: string): Promise<JourneyDefinition[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any)
    .from("journey_definitions")
    .select("id, journey_name, journey_type, description, status")
    .or(`organization_id.eq.${organizationId},is_global_template.eq.true`)
    .eq("status", "active");
  return (data ?? []).map((d: Record<string, string>) => ({
    id: d.id,
    organizationId,
    journeyName: d.journey_name,
    journeyType: d.journey_type as JourneyType,
    description: d.description,
    status: d.status,
    stepCount: 0,
  }));
}

export async function assignJourneyToPatient(opts: {
  organizationId: string;
  journeyDefinitionId: string;
  patientExternalId: string;
  patientId?: string;
}): Promise<{ assignmentId: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { assignmentId: "" };

  const { data } = await (supabase as any).from("journey_assignments").insert({
    organization_id: opts.organizationId,
    journey_definition_id: opts.journeyDefinitionId,
    patient_external_id: opts.patientExternalId,
    patient_id: opts.patientId ?? null,
    status: "active",
    current_step_order: 1,
    started_at: new Date().toISOString(),
  }).select("id").single();

  await publishRuntimeFabricEvent({
    eventKey: `journey.started.${data?.id}`,
    eventType: "agent",
    sourceSystem: "journey_library",
    targetChannel: "platform",
    priority: "moderate",
    summary: `Journey started for patient: ${opts.patientExternalId}`,
    payload: {
      assignmentId: data?.id,
      patientExternalId: opts.patientExternalId,
      journeyDefinitionId: opts.journeyDefinitionId,
    },
  }).catch(() => {});

  return { assignmentId: data?.id ?? "" };
}

export async function advanceJourneyStep(organizationId: string, assignmentId: string): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  const { data: assignment } = await (supabase as any).from("journey_assignments")
    .select("current_step_order, journey_definition_id").eq("id", assignmentId).maybeSingle();
  if (!assignment) return;

  const { data: nextStep } = await (supabase as any).from("journey_step_definitions")
    .select("id").eq("journey_definition_id", assignment.journey_definition_id)
    .eq("step_order", assignment.current_step_order + 1).maybeSingle();

  if (nextStep) {
    await (supabase as any).from("journey_assignments")
      .update({ current_step_order: assignment.current_step_order + 1 }).eq("id", assignmentId);
  } else {
    await (supabase as any).from("journey_assignments")
      .update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", assignmentId);
    await publishRuntimeFabricEvent({
      eventKey: `journey.completed.${assignmentId}`,
      eventType: "agent",
      sourceSystem: "journey_library",
      targetChannel: "platform",
      priority: "low",
      summary: `Journey completed: ${assignmentId}`,
      payload: { assignmentId },
    }).catch(() => {});
  }
}

export async function getPatientJourneys(organizationId: string, patientExternalId: string) {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any).from("journey_assignments")
    .select("id, status, current_step_order, started_at, completed_at, journey_definition_id")
    .eq("organization_id", organizationId).eq("patient_external_id", patientExternalId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
