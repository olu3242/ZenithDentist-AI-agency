import { AppShell } from "@/components/app/app-shell";
import { MetricCard } from "@/components/metric-card";
import { SubmitButton } from "@/components/auth/submit-button";
import { getAutomationOSState } from "@/lib/automation-os/registry";
import { getTenantData } from "@/lib/data/tenants";
import { getCurrentZenithRole } from "@/lib/server-auth";
import { deployPatientRevenueEngineAction, disableAutomationAction, enableAutomationAction, installAutomationAction, installPatientRevenueEngineAction } from "@/app/automation-marketplace/actions";
import { PATIENT_REVENUE_ENGINE_PRODUCT } from "@/lib/patient-revenue-engine";

export default async function AutomationMarketplacePage({ searchParams }: { searchParams?: Promise<{ status?: string; error?: string }> }) {
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
          {params?.error ? <p className="mt-4 rounded border border-rust/30 bg-rust/10 p-3 text-sm font-bold text-rust">Automation action failed: {params.error}.</p> : null}
        </header>

        <section className="rounded border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-primary">Marketplace Product</p>
              <h2 className="mt-2 text-2xl font-black text-foreground">{PATIENT_REVENUE_ENGINE_PRODUCT.name}</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-muted">{PATIENT_REVENUE_ENGINE_PRODUCT.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={installPatientRevenueEngineAction}>
                <SubmitButton pendingText="Installing PRE...">Install PRE</SubmitButton>
              </form>
              <form action={deployPatientRevenueEngineAction}>
                <SubmitButton className="bg-success hover:bg-success/90" pendingText="Deploying PRE...">Deploy PRE</SubmitButton>
              </form>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Catalog automations" value={state.registry.length} detail="Registry-backed packs" tone="primary" />
          <MetricCard label="Categories" value={state.categories.length} detail="Dental automation library" tone="accent" />
          <MetricCard label="Installed/active" value={state.counts.active + state.registry.filter(item => item.status === "installed").length} detail="Deployable automations" tone="success" />
          <MetricCard label="Available" value={state.counts.available} detail="Ready to install" tone="warning" />
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
                  <SubmitButton className="min-h-9 px-3 text-xs" pendingText="Installing...">Install</SubmitButton>
                </form>
                <form action={enableAutomationAction}>
                  <input type="hidden" name="workflowId" value={automation.workflow_id} />
                  <SubmitButton className="min-h-9 bg-success px-3 text-xs hover:bg-success/90" pendingText="Enabling...">Enable</SubmitButton>
                </form>
                <form action={disableAutomationAction}>
                  <input type="hidden" name="workflowId" value={automation.workflow_id} />
                  <SubmitButton className="min-h-9 border border-border bg-card px-3 text-xs text-muted hover:bg-paper" pendingText="Disabling...">Disable</SubmitButton>
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
