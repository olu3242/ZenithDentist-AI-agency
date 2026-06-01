import { AppShell } from "@/components/app/app-shell";
import { MetricCard } from "@/components/metric-card";
import { executeAutomationAction, pauseAutomationAction, resumeAutomationAction } from "@/app/automation-center/actions";
import { getAutomationOSState } from "@/lib/automation-os/registry";
import { getTenantData } from "@/lib/data/tenants";
import { getCurrentZenithRole } from "@/lib/server-auth";

export default async function AutomationCenterPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const [params, tenantData, role, state] = await Promise.all([
    searchParams,
    getTenantData(),
    getCurrentZenithRole("super_admin"),
    getAutomationOSState()
  ]);

  const active = state.registry.filter(item => item.status === "active");
  const failed = state.registry.filter(item => item.status === "failed");
  const queued = state.registry.filter(item => item.status === "installed");

  return (
    <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}>
      <div className="space-y-6">
        <header>
          <p className="text-xs font-black uppercase tracking-wider text-primary">Zenith Automation OS</p>
          <h1 className="mt-2 text-4xl font-black text-foreground">Automation Center</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">
            Active automations, failed automations, queued installs, health, execution history, and performance from live runtime traces.
          </p>
          {params?.status ? <p className="mt-4 rounded border border-green/30 bg-green/10 p-3 text-sm font-bold text-green">Automation {params.status}.</p> : null}
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active" value={active.length} detail="Enabled automations" tone="green" />
          <MetricCard label="Failed" value={failed.length} detail="Needs recovery" tone="rust" />
          <MetricCard label="Queued" value={queued.length} detail="Installed, waiting enablement" tone="gold" />
          <MetricCard label="Executions" value={state.counts.totalExecutions} detail="Runtime trace-backed" tone="blue" />
        </div>

        <section className="overflow-hidden rounded border border-border bg-card shadow-sm">
          <div className="border-b border-border p-5">
            <h2 className="text-xl font-black text-foreground">Execution History and Performance</h2>
          </div>
          <div className="grid divide-y divide-border">
            {state.registry.map(automation => {
              const performance = state.performance.find(item => item.workflowId === automation.workflow_id);
              return (
                <article key={automation.id} className="grid gap-4 p-5 xl:grid-cols-[1.3fr_.7fr_.7fr_.7fr_.9fr] xl:items-center">
                  <div>
                    <strong className="text-foreground">{automation.name}</strong>
                    <p className="mt-1 text-sm font-semibold text-muted">{automation.workflow_id} · {automation.category}</p>
                  </div>
                  <span className="text-sm font-black capitalize text-muted">{automation.status}</span>
                  <span className="text-sm font-bold text-muted">{performance?.executionCount ?? 0} runs</span>
                  <span className="text-sm font-bold text-muted">{performance?.successRate ?? 0}% success</span>
                  <div className="flex flex-wrap gap-2">
                    <form action={executeAutomationAction}>
                      <input type="hidden" name="workflowId" value={automation.workflow_id} />
                      <button className="min-h-9 rounded bg-primary px-3 text-xs font-black text-white" type="submit">Execute</button>
                    </form>
                    <form action={pauseAutomationAction}>
                      <input type="hidden" name="workflowId" value={automation.workflow_id} />
                      <button className="min-h-9 rounded border border-border bg-card px-3 text-xs font-black text-muted" type="submit">Pause</button>
                    </form>
                    <form action={resumeAutomationAction}>
                      <input type="hidden" name="workflowId" value={automation.workflow_id} />
                      <button className="min-h-9 rounded bg-success px-3 text-xs font-black text-white" type="submit">Resume</button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
