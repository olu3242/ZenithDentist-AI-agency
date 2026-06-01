"use server";

import { redirect } from "next/navigation";
import { executeRegisteredAutomation, updateAutomationStatus } from "@/lib/automation-os/registry";

export async function executeAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  await executeRegisteredAutomation(workflowId);
  redirect("/automation-center?status=executed");
}

export async function pauseAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  await updateAutomationStatus(workflowId, "paused");
  redirect("/automation-center?status=paused");
}

export async function resumeAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  await updateAutomationStatus(workflowId, "active");
  redirect("/automation-center?status=resumed");
}
