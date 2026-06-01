import { AppShell } from "@/components/app/app-shell";
import { MetricCard } from "@/components/metric-card";
import { getAutomationOSState } from "@/lib/automation-os/registry";
import { getTenantData } from "@/lib/data/tenants";
import { getCurrentZenithRole } from "@/lib/server-auth";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";

export default async function WorkflowOSPage() {
  const [tenantData, role, analytics, runtime, automationOS] = await Promise.all([
    getTenantData(),
    getCurrentZenithRole("super_admin"),
    getWorkflowAnalyticsSummary(),
    getWorkflowRuntimeHealth(),
    getAutomationOSState()
  ]);

  return (
    <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}>
      <div className="space-y-6">
        <header>
          <p className="text-xs font-black uppercase tracking-wider text-teal">Zenith Workflow OS</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Workflow OS</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">
            Registered dental automations, execution analytics, replay posture, SLA pressure, and workflow health.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Registered workflows" value={automationOS.registry.length} detail={`${automationOS.counts.active} active in registry`} tone="teal" />
          <MetricCard label="Operational score" value={`${runtime.operationalScore}%`} detail="Runtime health signal" tone="green" />
          <MetricCard label="Replay queue" value={runtime.replayQueue} detail="Recovery candidates" tone="gold" />
          <MetricCard label="SLA breaches" value={runtime.slaBreachCount} detail="Workflow pressure" tone="rust" />
        </div>
        <section className="rounded border border-line bg-white shadow-sm">
          <div className="border-b border-line p-5">
            <h2 className="text-xl font-black text-ink">Workflow Registry</h2>
          </div>
          <div className="grid divide-y divide-line">
            {runtime.workflowStates.map(workflow => {
              const registered = automationOS.registry.find(item => item.workflow_id === workflow.workflowId);
              return (
              <article key={workflow.workflowId} className="grid gap-3 p-5 md:grid-cols-[1.4fr_.8fr_.8fr_.6fr]">
                <div>
                  <strong className="text-ink">{workflow.name}</strong>
                  <p className="mt-1 text-sm font-semibold text-muted">{workflow.workflowId}</p>
                </div>
                <span className="text-sm font-bold capitalize text-muted">{workflow.domain}</span>
                <span className="text-sm font-bold capitalize text-muted">{registered?.status ?? workflow.state.replace("_", " ")}</span>
                <span className={workflow.healthy ? "text-sm font-black text-green" : "text-sm font-black text-rust"}>
                  {workflow.healthy ? "Healthy" : "Review"}
                </span>
              </article>
            );})}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
