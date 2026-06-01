"use server";

import { redirect } from "next/navigation";
import { updateAutomationStatus } from "@/lib/automation-os/registry";

export async function installAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  await updateAutomationStatus(workflowId, "installed");
  redirect("/automation-marketplace?status=installed");
}

export async function enableAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  await updateAutomationStatus(workflowId, "active");
  redirect("/automation-marketplace?status=enabled");
}

export async function disableAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  await updateAutomationStatus(workflowId, "disabled");
  redirect("/automation-marketplace?status=disabled");
}
