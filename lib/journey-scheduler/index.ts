import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type ScheduledStep = {
  id: string;
  organizationId: string;
  journeyAssignmentId: string;
  stepOrder: number;
  channel: string;
  scriptTemplateId?: string;
  scheduledFor: string; // ISO timestamp
  status: "scheduled" | "executing" | "delivered" | "failed" | "skipped";
};

export async function scheduleJourneySteps(
  organizationId: string,
  assignmentId: string
): Promise<ScheduledStep[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data: assignment } = await (supabase as any)
    .from("journey_assignments")
    .select("journey_definition_id, started_at")
    .eq("id", assignmentId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!assignment) return [];

  const { data: steps } = await (supabase as any)
    .from("journey_step_definitions")
    .select("id, step_order, channel, script_template_id, delay_days")
    .eq("journey_definition_id", assignment.journey_definition_id)
    .order("step_order", { ascending: true });

  if (!steps || steps.length === 0) return [];

  const startedAt = new Date(assignment.started_at).getTime();

  const rows = (steps as Array<{
    id: string;
    step_order: number;
    channel: string;
    script_template_id: string | null;
    delay_days: number;
  }>).map((step) => ({
    organization_id: organizationId,
    journey_assignment_id: assignmentId,
    journey_step_definition_id: step.id,
    step_order: step.step_order,
    channel: step.channel ?? "email",
    script_template_id: step.script_template_id ?? null,
    scheduled_for: new Date(startedAt + (step.delay_days ?? 0) * 86400000).toISOString(),
    status: "scheduled",
  }));

  const { data: upserted } = await (supabase as any)
    .from("journey_scheduled_steps")
    .upsert(rows, { onConflict: "journey_assignment_id,step_order" })
    .select("id, organization_id, journey_assignment_id, step_order, channel, script_template_id, scheduled_for, status");

  return (upserted ?? []).map(mapRow);
}

export async function getScheduledSteps(
  organizationId: string,
  assignmentId: string
): Promise<ScheduledStep[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("journey_scheduled_steps")
    .select("id, organization_id, journey_assignment_id, step_order, channel, script_template_id, scheduled_for, status")
    .eq("organization_id", organizationId)
    .eq("journey_assignment_id", assignmentId)
    .order("step_order", { ascending: true });

  return (data ?? []).map(mapRow);
}

export async function executeScheduledSteps(
  organizationId: string
): Promise<{ executed: number; failed: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { executed: 0, failed: 0 };

  const now = new Date().toISOString();

  const { data: dueSteps } = await (supabase as any)
    .from("journey_scheduled_steps")
    .select("id, journey_assignment_id, step_order, channel")
    .eq("organization_id", organizationId)
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (!dueSteps || dueSteps.length === 0) return { executed: 0, failed: 0 };

  let executed = 0;
  let failed = 0;

  for (const step of dueSteps as Array<{ id: string; journey_assignment_id: string; step_order: number; channel: string }>) {
    try {
      await (supabase as any)
        .from("journey_scheduled_steps")
        .update({ status: "executing" })
        .eq("id", step.id)
        .eq("organization_id", organizationId);

      await publishRuntimeFabricEvent({
        eventKey: `journey.step.executing.${step.id}`,
        eventType: "agent",
        sourceSystem: "journey_scheduler",
        targetChannel: step.channel ?? "platform",
        priority: "moderate",
        summary: `Executing journey step ${step.step_order} for assignment ${step.journey_assignment_id}`,
        payload: {
          stepId: step.id,
          assignmentId: step.journey_assignment_id,
          stepOrder: step.step_order,
          channel: step.channel,
        },
      }).catch(() => {});

      await (supabase as any)
        .from("journey_scheduled_steps")
        .update({ status: "delivered", executed_at: new Date().toISOString() })
        .eq("id", step.id)
        .eq("organization_id", organizationId);

      executed++;
    } catch (err) {
      await markStepFailed(organizationId, step.id, String(err));
      failed++;
    }
  }

  return { executed, failed };
}

export async function markStepFailed(
  organizationId: string,
  stepId: string,
  error: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await (supabase as any)
    .from("journey_scheduled_steps")
    .update({ status: "failed", error_message: error })
    .eq("id", stepId)
    .eq("organization_id", organizationId);
}

function mapRow(row: Record<string, unknown>): ScheduledStep {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    journeyAssignmentId: row.journey_assignment_id as string,
    stepOrder: row.step_order as number,
    channel: row.channel as string,
    scriptTemplateId: (row.script_template_id as string | null) ?? undefined,
    scheduledFor: row.scheduled_for as string,
    status: row.status as ScheduledStep["status"],
  };
}
