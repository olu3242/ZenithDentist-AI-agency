import {
  Activity,
  Bot,
  CheckCircle2,
  Circle,
  DatabaseZap,
  PlugZap,
  Rocket,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import {
  activatePracticeAction,
  certifyOnboardingAction,
  passOnboardingSimulationAction,
  saveOnboardingGoalsAction,
  saveOnboardingGovernanceAction,
  saveOnboardingPlaybooksAction
} from "@/app/onboarding/actions";
import type { DentalPracticeOnboardingState } from "@/lib/onboarding/dental-practice";

const goalOptions = [
  ["reduce_no_shows", "Reduce no-shows"],
  ["recover_recall", "Recover overdue recall"],
  ["increase_treatment_acceptance", "Increase treatment acceptance"],
  ["fill_chair_openings", "Fill chair openings"],
  ["improve_collections", "Improve collections"],
  ["reduce_admin_work", "Reduce administrative workload"],
  ["improve_retention", "Improve patient retention"],
  ["grow_new_patient_bookings", "Grow new-patient bookings"]
] as const;

const playbookOptions = [
  ["no_show_prevention", "No-Show Prevention"],
  ["recall_recovery", "Recall Recovery"],
  ["chair_fill", "Same-Day Chair Fill"],
  ["treatment_follow_up", "Treatment Follow-Up"],
  ["new_patient_conversion", "New Patient Conversion"],
  ["balance_follow_up", "Outstanding Balance Follow-Up"]
] as const;

const phases = [
  { key: "practice", label: "Practice", icon: DatabaseZap, steps: ["practice_created", "goals_captured"] },
  { key: "connect", label: "Connect", icon: PlugZap, steps: ["systems_connected", "data_validated"] },
  { key: "diagnose", label: "Diagnose", icon: Activity, steps: ["baseline_generated", "opportunities_identified"] },
  { key: "configure", label: "Configure", icon: ShieldCheck, steps: ["governance_configured", "playbooks_selected", "simulation_passed"] },
  { key: "launch", label: "Launch", icon: Rocket, steps: ["readiness_certified", "activated", "value_measurement_active"] }
] as const;

export function DentalPracticeOnboarding({ state }: { state: DentalPracticeOnboardingState }) {
  const completed = new Set(state.payload.completedSteps);

  return (
    <div className="space-y-6">
      <section className="rounded border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-primary">Dental Practice Activation</p>
            <h1 className="mt-2 text-3xl font-black text-foreground">Activate your Revenue Operating System</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-muted">
              Zenith reuses your existing practice, integration, revenue, patient-journey, automation, and reporting engines. This flow only asks for decisions the platform cannot safely infer.
            </p>
          </div>
          <div className="min-w-44 rounded bg-surface p-4 text-center">
            <p className="text-xs font-black uppercase tracking-wider text-muted">Activation progress</p>
            <strong className="mt-1 block text-3xl font-black text-primary">{state.progress}%</strong>
            <p className="text-xs font-semibold text-muted">Readiness {state.readinessScore}%</p>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-5">
          {phases.map(phase => {
            const phaseDone = phase.steps.every(step => completed.has(step));
            const Icon = phase.icon;
            return (
              <div key={phase.key} className="rounded border border-border bg-surface p-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${phaseDone ? "text-success" : "text-primary"}`} />
                  <span className="text-sm font-black text-foreground">{phase.label}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-muted">{phaseDone ? "Complete" : "In progress"}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <OnboardingCard number="01" title="Choose your practice goals" done={completed.has("goals_captured")}>
            <p className="text-sm font-semibold text-muted">Select up to three priorities. Zenith uses them to rank recovery opportunities and playbooks.</p>
            <form action={saveOnboardingGoalsAction} className="mt-4 grid gap-2 sm:grid-cols-2">
              {goalOptions.map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 rounded border border-border bg-surface p-3 text-sm font-bold text-foreground">
                  <input type="checkbox" name="goals" value={value} defaultChecked={state.payload.goals.includes(value)} />
                  {label}
                </label>
              ))}
              <button className="mt-2 min-h-11 rounded bg-primary px-4 text-sm font-black text-white sm:col-span-2">Save priorities</button>
            </form>
          </OnboardingCard>

          <OnboardingCard number="02" title="Connect and validate practice systems" done={completed.has("data_validated")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Capability label="PMS / integration installed" ready={state.capabilities.integrationInstalled} />
              <Capability label="Integration health verified" ready={state.capabilities.integrationHealthy} />
            </div>
            <p className="mt-3 text-xs font-semibold text-muted">
              This step is evidence-driven. Zenith will not mark it complete from a checkbox; it reads the existing Integration OS installation and health records.
            </p>
            {!state.capabilities.integrationInstalled && (
              <a href="/settings" className="mt-4 inline-flex min-h-10 items-center rounded border border-primary px-4 text-sm font-black text-primary">Open integration settings</a>
            )}
          </OnboardingCard>

          <OnboardingCard number="03" title="Generate baseline and revenue opportunity" done={completed.has("opportunities_identified")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Capability label="Practice baseline available" ready={state.capabilities.baselineAvailable} />
              <Capability label="Revenue opportunities detected" ready={state.capabilities.opportunitiesAvailable} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/portal/opportunity" className="inline-flex min-h-10 items-center rounded bg-primary px-4 text-sm font-black text-white">Open Opportunity Center</a>
              <a href="/internal/health" className="inline-flex min-h-10 items-center rounded border border-border px-4 text-sm font-black text-foreground">Review Practice Health</a>
            </div>
          </OnboardingCard>

          <OnboardingCard number="04" title="Set automation guardrails" done={completed.has("governance_configured")}>
            <form action={saveOnboardingGovernanceAction} className="mt-2 grid gap-3">
              <Toggle name="smsEnabled" label="Allow approved SMS workflows" checked={state.payload.governance.smsEnabled} />
              <Toggle name="emailEnabled" label="Allow approved email workflows" checked={state.payload.governance.emailEnabled} />
              <Toggle name="workingHoursOnly" label="Restrict patient outreach to working hours" checked={state.payload.governance.workingHoursOnly} />
              <Toggle name="financialApproval" label="Require human approval for financial messages" checked={state.payload.governance.requireHumanApprovalForFinancialMessages} />
              <label className="grid gap-1 text-sm font-bold text-foreground">
                Maximum outreach attempts
                <input className="rounded border border-border bg-surface px-3 py-2" name="maxOutreachAttempts" type="number" min="1" max="5" defaultValue={state.payload.governance.maxOutreachAttempts} />
              </label>
              <p className="text-xs font-semibold text-muted">Clinical diagnosis and treatment recommendations remain human-controlled and are not delegated by onboarding.</p>
              <button className="min-h-11 rounded bg-primary px-4 text-sm font-black text-white">Save governance</button>
            </form>
          </OnboardingCard>

          <OnboardingCard number="05" title="Select revenue playbooks" done={completed.has("playbooks_selected")}>
            <form action={saveOnboardingPlaybooksAction} className="grid gap-2 sm:grid-cols-2">
              {playbookOptions.map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 rounded border border-border bg-surface p-3 text-sm font-bold text-foreground">
                  <input type="checkbox" name="playbooks" value={value} defaultChecked={state.payload.selectedPlaybooks.includes(value)} />
                  {label}
                </label>
              ))}
              <button className="mt-2 min-h-11 rounded bg-primary px-4 text-sm font-black text-white sm:col-span-2">Save playbooks</button>
            </form>
          </OnboardingCard>

          <OnboardingCard number="06" title="Run safe simulation" done={completed.has("simulation_passed")}>
            <div className="rounded border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <strong className="text-sm text-foreground">No patient outreach is sent from this step.</strong>
                  <p className="mt-1 text-sm font-semibold text-muted">Review candidate populations, recommended playbooks, projected impact, and escalation behavior using synthetic/demo-safe execution before activation.</p>
                </div>
              </div>
            </div>
            {!completed.has("simulation_passed") ? (
              <form action={passOnboardingSimulationAction} className="mt-4">
                <button className="min-h-11 rounded border border-primary px-4 text-sm font-black text-primary">Record simulation review as passed</button>
              </form>
            ) : (
              <p className="mt-3 text-sm font-black text-success">Simulation review passed.</p>
            )}
          </OnboardingCard>
        </div>

        <aside className="space-y-6">
          <section className="rounded border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-muted">Launch readiness</p>
                <strong className="text-2xl font-black text-foreground">{state.readinessScore}/100</strong>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              {Object.entries(state.payload.readinessChecks).filter(([key]) => key !== "simulationPassed").map(([key, ready]) => (
                <Capability key={key} label={readinessLabel(key)} ready={Boolean(ready)} compact />
              ))}
            </div>

            {!completed.has("readiness_certified") ? (
              <form action={certifyOnboardingAction} className="mt-5">
                <button disabled={state.readinessScore < 100} className="min-h-11 w-full rounded bg-primary px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Certify readiness</button>
              </form>
            ) : (
              <div className="mt-5 rounded bg-success/10 p-3 text-sm font-black text-success">Readiness certified</div>
            )}

            <form action={activatePracticeAction} className="mt-3">
              <button disabled={!state.canActivate} className="min-h-12 w-full rounded bg-foreground px-4 text-sm font-black text-background disabled:cursor-not-allowed disabled:opacity-40">
                Activate practice
              </button>
            </form>
          </section>

          <section className="rounded border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="font-black text-foreground">Engine convergence</h2>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">Onboarding is an orchestration surface. It does not duplicate Zenith engines.</p>
            <ul className="mt-4 grid gap-2 text-sm font-bold text-foreground">
              <li>Integration OS → system evidence</li>
              <li>Practice Health → baseline</li>
              <li>Revenue Opportunity → diagnosis</li>
              <li>Revenue Playbooks → actions</li>
              <li>Patient Journey → communication lifecycle</li>
              <li>Automation Runtime → governed execution</li>
              <li>Command Center → post-launch measurement</li>
            </ul>
          </section>
        </aside>
      </section>
    </div>
  );
}

function OnboardingCard({ number, title, done, children }: { number: string; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        {done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted" />}
        <span className="text-xs font-black uppercase tracking-wider text-muted">{number}</span>
        <h2 className="text-lg font-black text-foreground">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Capability({ label, ready, compact = false }: { label: string; ready: boolean; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded border border-border bg-surface ${compact ? "p-2" : "p-3"}`}>
      {ready ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-muted" />}
      <span className="text-sm font-bold text-foreground">{label}</span>
    </div>
  );
}

function Toggle({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded border border-border bg-surface p-3 text-sm font-bold text-foreground">
      <input type="checkbox" name={name} defaultChecked={checked} />
      {label}
    </label>
  );
}

function readinessLabel(key: string) {
  return ({
    practice: "Practice workspace",
    goals: "Practice goals",
    integration: "System integration",
    data: "Data validation",
    baseline: "Practice baseline",
    governance: "Automation governance",
    playbooks: "Revenue playbooks",
    simulation: "Simulation review"
  } as Record<string, string>)[key] ?? key;
}
