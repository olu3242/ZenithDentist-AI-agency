import { redirect } from "next/navigation";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import { AuthError } from "@/components/auth/auth-card";
import { GlobalBrandLogo } from "@/components/branding/GlobalBrandLogo";
import { OnboardingCompletionForm } from "@/components/onboarding/onboarding-completion-form";
import { getOnboardingContext } from "@/lib/onboarding/bootstrap";

const setupSteps = [
  "Auth user created",
  "Profile record created",
  "Organization provisioned",
  "Membership attached",
  "Portal handoff ready"
];

export default async function OnboardingPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const context = await getOnboardingContext();
  if (!context) redirect("/login?reason=auth-required&from=/onboarding");

  const completed = Boolean(context.profile?.onboardingCompletedAt);

  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <GlobalBrandLogo />
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded border border-border bg-card p-6 shadow-soft">
            <p className="text-xs font-black uppercase tracking-wider text-primary">Onboarding workspace</p>
            <h1 className="mt-3 text-4xl font-black text-foreground">Finish activating Zenith</h1>
            <p className="mt-3 text-base font-semibold leading-7 text-muted">
              Confirm the records created during signup, synchronize onboarding state, and hand off to the correct role-based portal.
            </p>
            <AuthError message={params?.error} />

            <div className="mt-6 grid gap-3">
              {setupSteps.map((step, index) => {
                const ready =
                  index === 0 ||
                  (index === 1 && Boolean(context.profile)) ||
                  (index === 2 && Boolean(context.organization)) ||
                  (index === 3 && context.membershipReady) ||
                  (index === 4 && Boolean(context.redirectTo));
                return (
                  <div key={step} className="flex items-center gap-3 rounded border border-border bg-surface px-4 py-3">
                    {ready ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted" />}
                    <span className="text-sm font-bold text-foreground">{step}</span>
                  </div>
                );
              })}
            </div>

            {completed ? (
              <a href={context.redirectTo} className="mt-6 inline-flex min-h-12 items-center justify-center rounded bg-primary px-5 text-sm font-black text-white">
                Open your portal
              </a>
            ) : (
              <OnboardingCompletionForm />
            )}
          </div>

          <aside className="rounded border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-muted">Portal handoff</p>
                <strong className="block text-lg text-foreground">{context.redirectTo}</strong>
              </div>
            </div>
            <dl className="mt-6 grid gap-4 text-sm">
              <div className="rounded bg-surface p-4">
                <dt className="font-black uppercase tracking-wider text-muted">Profile</dt>
                <dd className="mt-1 font-bold text-foreground">{context.profile?.fullName ?? "Pending profile"}</dd>
                <dd className="text-muted">{context.profile?.email ?? "No email resolved"}</dd>
              </div>
              <div className="rounded bg-surface p-4">
                <dt className="font-black uppercase tracking-wider text-muted">Organization</dt>
                <dd className="mt-1 font-bold text-foreground">{context.organization?.name ?? "Pending organization"}</dd>
                <dd className="text-muted">Status: {context.organization?.onboardingStatus ?? "unknown"}</dd>
              </div>
              <div className="rounded bg-surface p-4">
                <dt className="font-black uppercase tracking-wider text-muted">Membership</dt>
                <dd className="mt-1 font-bold text-foreground">{context.membershipReady ? "Ready" : "Missing"}</dd>
                <dd className="text-muted">Organization ID: {context.organizationId}</dd>
              </div>
            </dl>
          </aside>
        </section>
      </div>
    </main>
  );
}
