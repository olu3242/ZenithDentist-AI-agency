"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { completeOnboardingAction } from "@/app/onboarding/actions";

export function OnboardingCompletionForm() {
  return (
    <form action={completeOnboardingAction} className="mt-6">
      <OnboardingSubmitButton />
    </form>
  );
}

function OnboardingSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-black text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
      aria-disabled={pending}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
      {pending ? "Finalizing onboarding..." : "Complete onboarding and open portal"}
    </button>
  );
}
