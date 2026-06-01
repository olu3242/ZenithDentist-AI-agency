"use server";

import { redirect } from "next/navigation";
import { updateAutomationStatus } from "@/lib/automation-os/registry";
import { PATIENT_REVENUE_ENGINE_PRODUCT } from "@/lib/patient-revenue-engine";

export async function installAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  if (!workflowId) redirect("/automation-marketplace?error=missing-workflow");
  await updateAutomationStatus(workflowId, "installed");
  redirect("/automation-marketplace?status=installed");
}

export async function enableAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  if (!workflowId) redirect("/automation-marketplace?error=missing-workflow");
  await updateAutomationStatus(workflowId, "active");
  redirect("/automation-marketplace?status=enabled");
}

export async function disableAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  if (!workflowId) redirect("/automation-marketplace?error=missing-workflow");
  await updateAutomationStatus(workflowId, "disabled");
  redirect("/automation-marketplace?status=disabled");
}

export async function installPatientRevenueEngineAction() {
  for (const workflowId of PATIENT_REVENUE_ENGINE_PRODUCT.workflows) {
    await updateAutomationStatus(workflowId, "installed");
  }
  redirect("/automation-marketplace?status=pre-installed");
}

export async function deployPatientRevenueEngineAction() {
  for (const workflowId of PATIENT_REVENUE_ENGINE_PRODUCT.workflows) {
    await updateAutomationStatus(workflowId, "active");
  }
  redirect("/automation-marketplace?status=pre-deployed");
}
