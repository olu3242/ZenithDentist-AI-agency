import { redirect } from "next/navigation";
import { AuthError } from "@/components/auth/auth-card";
import { ZenithLogo } from "@/components/branding/ZenithLogo";
import { DentalPracticeOnboarding } from "@/components/onboarding/dental-practice-onboarding";
import { getOnboardingContext } from "@/lib/onboarding/bootstrap";
import { getDentalPracticeOnboarding } from "@/lib/onboarding/dental-practice";
import { reconcileDentalOnboardingFlow } from "@/lib/flow-orchestration/bridges/dental-onboarding";

export default async function OnboardingPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const context = await getOnboardingContext();
  if (!context) redirect("/login?reason=auth-required&from=/onboarding");

  const state = await getDentalPracticeOnboarding(context.organizationId);

  // Flow Orchestration OS is a convergence layer over the existing onboarding
  // persistence and engines. Reconciliation is intentionally non-destructive:
  // tenant_onboarding_runs remains the current business-state source while the
  // durable flow run coordinates cross-engine transitions, waits and approvals.
  await reconcileDentalOnboardingFlow({
    organizationId: context.organizationId,
    completedSteps: state.payload.completedSteps,
    context: {
      readinessScore: state.readinessScore,
      integrationInstalled: state.capabilities.integrationInstalled,
      integrationHealthy: state.capabilities.integrationHealthy,
      simulationEvidenceHash: state.payload.simulationEvidence?.evidenceHash ?? null
    }
  });

  return (
    <main className="min-h-screen bg-background px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <ZenithLogo />
        <div className="mt-6">
          <AuthError message={params?.error} />
          {params?.notice ? (
            <div className="mb-4 rounded border border-success/30 bg-success/10 px-4 py-3 text-sm font-bold text-success">
              {params.notice}
            </div>
          ) : null}
          <DentalPracticeOnboarding state={state} />
        </div>
      </div>
    </main>
  );
}
