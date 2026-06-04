import { ActionCard } from "@/components/workflow/action-card";
import { AliceActionLayer } from "@/components/workflow/alice-action-layer";
import { calculatePracticeHealthScore, calculateWorkflowOutcomes, getWorkflowCatalogItem, type UniversalAction } from "@/lib/action-engine";
import type { AutomationOSState } from "@/lib/automation-os/registry";
import type { AdminDashboardData } from "@/lib/data/leads";
import type { TenantData } from "@/lib/data/tenants";
import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

export function CommandCenterV2({
  title,
  subtitle,
  sections,
  actions,
  tenantData,
  admin,
  runtime,
  automationOS,
  returnTo
}: {
  title: string;
  subtitle: string;
  sections: Array<{ label: string; workflowId: string; value: string | number; detail: string }>;
  actions: UniversalAction[];
  tenantData: TenantData;
  admin: AdminDashboardData;
  runtime: RuntimeHealthState;
  automationOS: AutomationOSState;
  returnTo: string;
}) {
  const health = calculatePracticeHealthScore({ tenantData, admin, runtime, automationOS });
  const outcomes = calculateWorkflowOutcomes({ admin, automationOS });
  const firstWorkflow = getWorkflowCatalogItem(sections[0]?.workflowId ?? "alice_practice_health_agent");

  return (
    <div className="space-y-6">
      <header>
        <p className="brand-kicker">Workflow-first operating system</p>
        <h1 className="mt-2 text-4xl font-black text-ink">{title}</h1>
        <p className="mt-2 max-w-3xl text-base font-semibold text-muted">{subtitle}</p>
      </header>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Score label="Practice Health" value={`${health.practiceHealthScore}%`} />
        <Score label="Revenue Recovered" value={`$${outcomes.revenueRecovered.toLocaleString()}`} />
        <Score label="Patients Recovered" value={outcomes.patientsRecovered} />
        <Score label="Reviews Generated" value={outcomes.reviewsGenerated} />
        <Score label="Hours Saved" value={outcomes.hoursSaved} />
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        {sections.map(section => {
          const workflow = getWorkflowCatalogItem(section.workflowId);
          if (!workflow) return null;
          const performance = automationOS.performance.find(item => item.workflowId === workflow.id);
          return (
            <div key={section.label} className="grid gap-3">
              <ActionCard
                title={section.label}
                value={section.value}
                detail={section.detail}
                workflow={workflow}
                actions={actions.filter(action => action.workflowId === workflow.id)}
                returnTo={returnTo}
              />
              <div className="rounded border border-line bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-muted">Execution proof</p>
                <div className="mt-3 grid gap-2 text-sm font-semibold text-muted">
                  <Proof label="Execution History" value={`${performance?.executionCount ?? 0} runs`} />
                  <Proof label="Success Rate" value={`${performance?.successRate ?? 0}%`} />
                  <Proof label="Failures" value={`${performance?.failureRate ?? 0}% failure rate`} />
                  <Proof label="Recoveries" value={performance?.recoveryStatus ?? "not_run"} />
                  <Proof label="Revenue Impact" value={`$${outcomes.revenueRecovered.toLocaleString()} attributed pool`} />
                </div>
              </div>
            </div>
          );
        })}
      </section>
      {firstWorkflow ? (
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-ink">Automation action layer</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {actions.filter(action => action.stage === "recommend").slice(0, 4).map(action => {
              const workflow = getWorkflowCatalogItem(action.workflowId) ?? firstWorkflow;
              return <AliceActionLayer key={action.id} recommendation={action.aliceRecommendation} workflow={workflow} returnTo={returnTo} />;
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Proof({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded bg-paper px-3 py-2">
      <span>{label}</span>
      <strong className="text-ink">{value}</strong>
    </div>
  );
}

function Score({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-teal">{value}</strong>
    </article>
  );
}
