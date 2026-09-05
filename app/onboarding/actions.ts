"use server";

import { redirect } from "next/navigation";
import { completeOnboarding, getOnboardingContext } from "@/lib/onboarding/bootstrap";
import {
  activateDentalPractice,
  certifyDentalOnboarding,
  markDentalSimulationPassed,
  saveDentalGovernance,
  saveDentalOnboardingGoals,
  saveDentalPlaybooks,
  type DentalOnboardingGoal
} from "@/lib/onboarding/dental-practice";
import { logger } from "@/lib/logger";

async function requireOrganizationId() {
  const context = await getOnboardingContext();
  if (!context) redirect("/login?reason=auth-required&from=/onboarding");
  return context.organizationId;
}

function redirectWithResult(result: { ok: boolean; message: string }) {
  const key = result.ok ? "notice" : "error";
  redirect(`/onboarding?${key}=${encodeURIComponent(result.message)}`);
}

export async function saveOnboardingGoalsAction(formData: FormData) {
  const organizationId = await requireOrganizationId();
  const goals = formData.getAll("goals").map(String) as DentalOnboardingGoal[];
  if (goals.length < 1 || goals.length > 3) {
    redirect("/onboarding?error=Select%20between%201%20and%203%20practice%20goals.");
  }
  redirectWithResult(await saveDentalOnboardingGoals(organizationId, goals));
}

export async function saveOnboardingGovernanceAction(formData: FormData) {
  const organizationId = await requireOrganizationId();
  const attempts = Math.min(5, Math.max(1, Number(formData.get("maxOutreachAttempts") ?? 3)));
  redirectWithResult(
    await saveDentalGovernance(organizationId, {
      smsEnabled: formData.get("smsEnabled") === "on",
      emailEnabled: formData.get("emailEnabled") === "on",
      workingHoursOnly: formData.get("workingHoursOnly") === "on",
      maxOutreachAttempts: attempts,
      requireHumanApprovalForFinancialMessages: formData.get("financialApproval") === "on",
      requireHumanApprovalForClinicalMessages: true
    })
  );
}

export async function saveOnboardingPlaybooksAction(formData: FormData) {
  const organizationId = await requireOrganizationId();
  const playbooks = formData.getAll("playbooks").map(String);
  if (playbooks.length === 0) {
    redirect("/onboarding?error=Select%20at%20least%20one%20revenue%20playbook.");
  }
  redirectWithResult(await saveDentalPlaybooks(organizationId, playbooks));
}

export async function passOnboardingSimulationAction() {
  const organizationId = await requireOrganizationId();
  redirectWithResult(await markDentalSimulationPassed(organizationId));
}

export async function certifyOnboardingAction() {
  const organizationId = await requireOrganizationId();
  redirectWithResult(await certifyDentalOnboarding(organizationId));
}

export async function activatePracticeAction() {
  const organizationId = await requireOrganizationId();
  const result = await activateDentalPractice(organizationId);
  if (!result.ok) redirectWithResult(result);

  const completion = await completeOnboarding();
  if (completion.ok && completion.redirectTo) {
    logger.info("dental_practice_onboarding_activated", {
      userId: completion.userId,
      organizationId: completion.organizationId,
      role: completion.role,
      redirectTo: completion.redirectTo
    });
    redirect(completion.redirectTo);
  }

  redirectWithResult({ ok: false, message: completion.message });
}

export async function completeOnboardingAction() {
  const result = await completeOnboarding();
  if (result.ok && result.redirectTo) {
    logger.info("onboarding_portal_handoff", {
      userId: result.userId,
      organizationId: result.organizationId,
      role: result.role,
      redirectTo: result.redirectTo
    });
    redirect(result.redirectTo);
  }

  redirect(`/onboarding?error=${encodeURIComponent(result.message)}`);
}
