"use server";

import { redirect } from "next/navigation";
import { completeOnboarding } from "@/lib/onboarding/bootstrap";
import { logger } from "@/lib/logger";

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
