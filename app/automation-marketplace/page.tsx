import { AppShell } from "@/components/app/app-shell";
import { MetricCard } from "@/components/metric-card";
import { getAutomationOSState } from "@/lib/automation-os/registry";
import { getTenantData } from "@/lib/data/tenants";
import { getCurrentZenithRole } from "@/lib/server-auth";
import { disableAutomationAction, enableAutomationAction, installAutomationAction } from "@/app/automation-marketplace/actions";

export default async function AutomationMarketplacePage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const [params, tenantData, role, state] = await Promise.all([
    searchParams,
    getTenantData(),
    getCurrentZenithRole("super_admin"),
    getAutomationOSState()
  ]);

  return (
    <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}>
      <div className="space-y-6">
        <header>
          <p className="text-xs font-black uppercase tracking-wider text-primary">Zenith Automation OS</p>
          <h1 className="mt-2 text-4xl font-black text-foreground">Automation Marketplace</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">
            Install, enable, disable, configure, and version registered dental automation packs for this organization.
          </p>
          {params?.status ? <p className="mt-4 rounded border border-green/30 bg-green/10 p-3 text-sm font-bold text-green">Automation {params.status}.</p> : null}
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Catalog automations" value={state.registry.length} detail="Registry-backed packs" tone="blue" />
          <MetricCard label="Categories" value={state.categories.length} detail="Dental automation library" tone="teal" />
          <MetricCard label="Installed/active" value={state.counts.active + state.registry.filter(item => item.status === "installed").length} detail="Deployable automations" tone="green" />
          <MetricCard label="Available" value={state.counts.available} detail="Ready to install" tone="gold" />
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.registry.map(automation => (
            <article key={automation.id} className="rounded border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-primary">{automation.category}</p>
                  <h2 className="mt-2 text-xl font-black text-foreground">{automation.name}</h2>
                </div>
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-black capitalize text-muted">{automation.status}</span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-muted">{automation.description}</p>
              <dl className="mt-4 grid gap-2 text-sm">
                <div className="rounded bg-surface p-3">
                  <dt className="font-black text-muted">Trigger</dt>
                  <dd className="font-semibold text-foreground">{automation.trigger}</dd>
                </div>
                <div className="rounded bg-surface p-3">
                  <dt className="font-black text-muted">Workflow</dt>
                  <dd className="font-semibold text-foreground">{automation.workflow_id}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <form action={installAutomationAction}>
                  <input type="hidden" name="workflowId" value={automation.workflow_id} />
                  <button className="min-h-9 rounded bg-primary px-3 text-xs font-black text-white" type="submit">Install</button>
                </form>
                <form action={enableAutomationAction}>
                  <input type="hidden" name="workflowId" value={automation.workflow_id} />
                  <button className="min-h-9 rounded bg-success px-3 text-xs font-black text-white" type="submit">Enable</button>
                </form>
                <form action={disableAutomationAction}>
                  <input type="hidden" name="workflowId" value={automation.workflow_id} />
                  <button className="min-h-9 rounded border border-border bg-card px-3 text-xs font-black text-muted" type="submit">Disable</button>
                </form>
              </div>
            </article>
          ))}
        </section>

        {!state.registry.length ? (
          <section className="rounded border border-border bg-card p-6 text-sm font-semibold text-muted">
            Automation registry is empty because Supabase service configuration is unavailable or the organization has not been created.
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
