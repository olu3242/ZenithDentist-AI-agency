import Link from "next/link";
import { ArrowRight, Brain, FileText, GitBranch, Sparkles } from "lucide-react";
import { AliceActionLayer } from "@/components/workflow/alice-action-layer";
import { ActionCard } from "@/components/workflow/action-card";
import type { AutomationOSState } from "@/lib/automation-os/registry";
import { buildUniversalActions, calculatePracticeHealthScore, calculateWorkflowOutcomes, getWorkflowCatalogItem } from "@/lib/action-engine";
import type { AdminDashboardData } from "@/lib/data/leads";
import type { TenantData } from "@/lib/data/tenants";
import type { PersonaDefinition, PersonaKpi } from "@/lib/personas";
import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

export function PersonaCommandCenter({
  persona,
  tenantData,
  admin,
  runtime,
  automationOS
}: {
  persona: PersonaDefinition;
  tenantData: TenantData;
  admin: AdminDashboardData;
  runtime: RuntimeHealthState;
  automationOS: AutomationOSState;
}) {
  const kpiValues = buildKpiValues({ tenantData, admin, runtime, automationOS });
  const health = calculatePracticeHealthScore({ tenantData, admin, runtime, automationOS });
  const outcomes = calculateWorkflowOutcomes({ admin, automationOS });
  const surface = persona.key === "agency_growth_operator" ? "growth" : persona.key === "office_manager" || persona.key === "zenith_platform_operator" ? "operations" : "executive";
  const universalActions = buildUniversalActions(surface);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="grid gap-5 xl:grid-cols-[1fr_360px] xl:items-end">
        <div>
          <p className="brand-kicker">{persona.roleLabel}</p>
          <h1 className="mt-2 text-4xl font-black text-ink">{persona.label}</h1>
          <p className="mt-3 max-w-3xl text-base font-semibold text-muted">{persona.mission}</p>
          <p className="mt-2 text-sm font-bold text-teal">{persona.operatingCadence}</p>
        </div>
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-teal" />
            <h2 className="text-sm font-black uppercase tracking-wider text-ink">Revenue priority</h2>
          </div>
          <p className="mt-3 text-sm font-semibold text-muted">{persona.aliceRecommendations[0]}</p>
          <Link href="/portal/alice" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-teal">
            Open AI Revenue Intelligence recommendations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Persona KPIs">
        {persona.kpis.map((kpi, index) => {
          const workflow = getWorkflowCatalogItem(workflowForKpi(kpi.key, index));
          if (!workflow) return null;
          return (
            <ActionCard
              key={kpi.key}
              title={kpi.label}
              value={kpiValues[kpi.key] ?? "0"}
              detail={kpi.outcome}
              workflow={workflow}
              actions={universalActions.filter(action => action.workflowId === workflow.id)}
            />
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <HealthScore label="Practice Health" value={`${health.practiceHealthScore}%`} />
        <HealthScore label="Revenue Health" value={`${health.revenueHealth}%`} />
        <HealthScore label="Operations" value={`${health.operationalHealth}%`} />
        <HealthScore label="Growth" value={`${health.growthHealth}%`} />
        <HealthScore label="Patients" value={`${health.patientHealth}%`} />
        <HealthScore label="Automation" value={`${health.automationHealth}%`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-muted">Mission domains</p>
              <h2 className="mt-1 text-xl font-black text-ink">Drill down from outcomes</h2>
            </div>
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {persona.navigation.filter(item => item.href !== "/settings").map(item => (
              <Link key={`${item.href}-${item.label}`} href={item.href} className="rounded border border-line bg-paper p-4 hover:border-teal/60 hover:bg-white">
                <p className="text-xs font-black uppercase tracking-wider text-teal">{item.domain}</p>
                <strong className="mt-2 block text-base font-black text-ink">{item.label}</strong>
                <span className="mt-1 block text-sm font-semibold text-muted">{item.description}</span>
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-blue" />
            <h2 className="text-sm font-black uppercase tracking-wider text-ink">Persona workflows</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {persona.workflows.map((workflow, index) => {
              const registryMatch = automationOS.registry.find(item => item.name === workflow || item.category === workflow || item.workflow_id.toLowerCase().includes(workflow.toLowerCase().split(" ")[0] ?? ""));
              return (
                <div key={workflow} className="flex items-center justify-between gap-3 rounded border border-line bg-paper px-4 py-3">
                  <div>
                    <strong className="block text-sm text-ink">{workflow}</strong>
                    <span className="text-xs font-bold text-muted">{registryMatch?.status ?? (index === 0 ? "priority" : "ready")}</span>
                  </div>
                  <Link href="/automation-center" className="shrink-0 text-xs font-black text-teal">Open</Link>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded border border-line bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-teal" />
            <h2 className="text-sm font-black uppercase tracking-wider text-ink">Embedded AI Revenue Intelligence recommendations</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {persona.aliceRecommendations.map((recommendation, index) => {
              const workflow = getWorkflowCatalogItem(workflowForKpi(persona.kpis[index % persona.kpis.length]?.key ?? "workflowHealth", index));
              return workflow ? <AliceActionLayer key={recommendation} recommendation={recommendation} workflow={workflow} /> : null;
            })}
          </div>
        </article>
        <article className="rounded border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green" />
            <h2 className="text-sm font-black uppercase tracking-wider text-ink">Reports</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {persona.reports.map(report => (
              <Link key={report} href="/portal/reports" className="rounded border border-line bg-paper px-4 py-3 text-sm font-black text-ink hover:border-teal/60 hover:bg-white">
                {report}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <HealthScore label="Revenue Generated" value={`$${outcomes.revenueGenerated.toLocaleString()}`} />
        <HealthScore label="Revenue Recovered" value={`$${outcomes.revenueRecovered.toLocaleString()}`} />
        <HealthScore label="Patients Recovered" value={outcomes.patientsRecovered} />
        <HealthScore label="Reviews Generated" value={outcomes.reviewsGenerated} />
        <HealthScore label="Hours Saved" value={outcomes.hoursSaved} />
      </section>
    </div>
  );
}

function buildKpiValues({
  tenantData,
  admin,
  runtime,
  automationOS
}: {
  tenantData: TenantData;
  admin: AdminDashboardData;
  runtime: RuntimeHealthState;
  automationOS: AutomationOSState;
}): Record<PersonaKpi["key"], string | number> {
  const revenueRecovery = admin.roiCalculations.reduce((sum, item) => sum + Number(item.recoverable_revenue ?? 0), 0);
  const bookedCalls = admin.bookings.filter(booking => booking.booking_status === "scheduled" || booking.booking_status === "clicked").length;
  const patientRecovery = admin.roiCalculations.reduce((sum, item) => sum + Number(item.recall_opportunity ?? 0), 0);
  const reviewVelocity = admin.events.filter(event => String(event.event_type).includes("review")).length;

  return {
    appointments: admin.bookings.length || admin.leads.length,
    automationExecutions: automationOS.counts.totalExecutions,
    bookedCalls,
    leads: admin.leads.length,
    locations: tenantData.locations.length,
    organizations: tenantData.organization.id.startsWith("org-") ? 0 : 1,
    patientRecovery: `$${Math.round(patientRecovery).toLocaleString()}`,
    revenueRecovery: `$${Math.round(revenueRecovery).toLocaleString()}`,
    reviewVelocity,
    slaBreaches: runtime.slaBreaches.length,
    workflowHealth: `${runtime.scores.operationalScore || runtime.scores.observabilityScore}%`
  };
}

function workflowForKpi(kpiKey: string, index: number) {
  const byKpi: Record<string, string> = {
    appointments: "schedule_gap_fill",
    automationExecutions: "alice_practice_health_agent",
    bookedCalls: "lead_created",
    leads: "lead_created",
    locations: "recall_capacity_optimization",
    organizations: "alice_practice_health_agent",
    patientRecovery: "recall_due",
    revenueRecovery: "treatment_recovery",
    reviewVelocity: "review_request_due",
    slaBreaches: "ai_followup_required",
    workflowHealth: "alice_practice_health_agent"
  };
  return byKpi[kpiKey] ?? ["recall_due", "review_request_due", "schedule_gap_fill", "alice_practice_health_agent"][index % 4];
}

function HealthScore({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-teal">{value}</strong>
    </article>
  );
}
