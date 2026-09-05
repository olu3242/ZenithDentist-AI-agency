"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTenantData } from "@/lib/data/tenants";
import { getOptionalCurrentZenithRole } from "@/lib/server-auth";
import {
  approveFlowGate,
  auditWorkflowDrillThrough,
  cancelFlowAsOperator,
  rejectFlowGate,
  resumeFlowWait,
  retryFlowNow,
  type FlowOperatorIdentity
} from "@/lib/flow-orchestration/operator-actions";

async function operatorContext() {
  const role = await getOptionalCurrentZenithRole();
  if (role !== "super_admin") throw new Error("Flow operator actions require super-admin access.");

  const tenant = await getTenantData();
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const cookieStore = await cookies();
  const headerStore = await headers();
  const actorId =
    cookieStore.get("zenith_user_id")?.value ??
    headerStore.get("x-zenith-user-id") ??
    "super_admin";
  const actor: FlowOperatorIdentity = { actorId, actorRole: role };
  return { organizationId, actor };
}

function required(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function note(formData: FormData) {
  return String(formData.get("note") ?? "").trim().slice(0, 1000);
}

async function finish(result: { ok?: boolean; message?: string }) {
  revalidatePath("/workflow-os/flows");
  revalidatePath("/workflow-os");
  if (!result.ok) throw new Error(result.message ?? "Flow operator action failed.");
}

export async function approveFlowAction(formData: FormData) {
  const { organizationId, actor } = await operatorContext();
  await finish(await approveFlowGate({ organizationId, flowRunId: required(formData, "flowRunId"), actor, note: note(formData) }));
}

export async function rejectFlowAction(formData: FormData) {
  const { organizationId, actor } = await operatorContext();
  await finish(await rejectFlowGate({ organizationId, flowRunId: required(formData, "flowRunId"), actor, note: note(formData) }));
}

export async function retryFlowAction(formData: FormData) {
  const { organizationId, actor } = await operatorContext();
  await finish(await retryFlowNow({ organizationId, flowRunId: required(formData, "flowRunId"), actor, note: note(formData) }));
}

export async function resumeFlowAction(formData: FormData) {
  const { organizationId, actor } = await operatorContext();
  await finish(await resumeFlowWait({ organizationId, flowRunId: required(formData, "flowRunId"), actor, note: note(formData) }));
}

export async function cancelFlowAction(formData: FormData) {
  const { organizationId, actor } = await operatorContext();
  await finish(await cancelFlowAsOperator({ organizationId, flowRunId: required(formData, "flowRunId"), actor, note: note(formData) }));
}

export async function openWorkflowExecutionAction(formData: FormData) {
  const { organizationId, actor } = await operatorContext();
  const flowRunId = required(formData, "flowRunId");
  const workflowExecutionId = required(formData, "workflowExecutionId");
  const result = await auditWorkflowDrillThrough({ organizationId, flowRunId, workflowExecutionId, actor });
  if (!result.ok) throw new Error(result.message ?? "Unable to open workflow execution.");
  redirect(`/workflow-os?executionId=${encodeURIComponent(workflowExecutionId)}&flowRunId=${encodeURIComponent(flowRunId)}`);
}
