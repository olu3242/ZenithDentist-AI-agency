"use server";

import { redirect } from "next/navigation";
import { executeRegisteredAutomation, updateAutomationStatus } from "@/lib/automation-os/registry";

export async function executeAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  const returnTo = safeReturnTo(String(formData.get("returnTo") ?? "/automation-center"));
  if (!workflowId) redirect(withStatus(returnTo, "error", "missing-workflow"));
  await executeRegisteredAutomation(workflowId);
  redirect(withStatus(returnTo, "status", "executed"));
}

export async function pauseAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  if (!workflowId) redirect("/automation-center?error=missing-workflow");
  await updateAutomationStatus(workflowId, "paused");
  redirect("/automation-center?status=paused");
}

export async function resumeAutomationAction(formData: FormData) {
  const workflowId = String(formData.get("workflowId") ?? "");
  if (!workflowId) redirect("/automation-center?error=missing-workflow");
  await updateAutomationStatus(workflowId, "active");
  redirect("/automation-center?status=resumed");
}

function safeReturnTo(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/automation-center";
}

function withStatus(pathname: string, key: "status" | "error", value: string) {
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}${key}=${encodeURIComponent(value)}`;
}
