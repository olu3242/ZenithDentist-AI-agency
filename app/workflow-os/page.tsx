import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { MetricCard } from "@/components/metric-card";
import { getTranslations } from "next-intl/server";
import { getAutomationOSState } from "@/lib/automation-os/registry";
import { getTenantData } from "@/lib/data/tenants";
import { getCurrentZenithRole } from "@/lib/server-auth";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";

export default async function WorkflowOSPage() {
  const t = await getTranslations("workflowOS");
  const [tenantData, role, analytics, runtime, automationOS] = await Promise.all([
    getTenantData(),
    getCurrentZenithRole("super_admin"),
    getWorkflowAnalyticsSummary(),
    getWorkflowRuntimeHealth(),
    getAutomationOSState()
  ]);

  void analytics;

  return (
    <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="brand-kicker">{t("kicker")}</p>
            <h1 className="mt-2 text-4xl font-black text-ink">{t("title")}</h1>
            <p className="mt-2 max-w-3xl text-base font-semibold text-muted">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="/workflow-os/flows"
            className="inline-flex items-center justify-center rounded bg-teal px-4 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90"
          >
            Open Flow Control Center
          </Link>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label={t("registeredWorkflows")} value={automationOS.registry.length} detail={`${automationOS.counts.active} active in registry`} tone="teal" />
          <MetricCard label={t("operationalScore")} value={`${runtime.operationalScore}%`} detail="Runtime health signal" tone="green" />
          <MetricCard label={t("replayQueue")} value={runtime.replayQueue} detail="Recovery candidates" tone="gold" />
          <MetricCard label={t("slaBreaches")} value={runtime.slaBreachCount} detail="Workflow pressure" tone="rust" />
        </div>
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-muted">Orchestration layer</p>
              <h2 className="mt-1 text-xl font-black text-ink">Cross-workflow business process control</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-muted">
                Flow OS coordinates multi-step business processes, waits, approvals, retries, and recovery while Workflow OS remains the canonical automation execution boundary.
              </p>
            </div>
            <Link href="/workflow-os/flows" className="text-sm font-black text-teal underline decoration-2 underline-offset-4">
              Inspect active flows →
            </Link>
          </div>
        </section>
        <section className="rounded border border-line bg-white shadow-sm">
          <div className="border-b border-line p-5">
            <h2 className="text-xl font-black text-ink">{t("registry")}</h2>
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
                  {workflow.healthy ? t("healthy") : t("review")}
                </span>
              </article>
            );})}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
