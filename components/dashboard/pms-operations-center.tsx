import Link from "next/link";
import { AlertTriangle, CheckCircle2, DatabaseZap, FileDown, Link2, RefreshCw, ServerCrash, Shuffle, UploadCloud } from "lucide-react";
import { PMSIntegrationManager } from "@/components/enterprise/pms-integration-manager";
import { MetricCard } from "@/components/ui/canonical";
import type { getPMSOperationsState } from "@/lib/pms-operations";

type PMSOperationsState = Awaited<ReturnType<typeof getPMSOperationsState>>;

const tabs = [
  ["/dashboard/pms", "Overview"],
  ["/dashboard/pms/connections", "Connections"],
  ["/dashboard/pms/sync-health", "Sync Health"],
  ["/dashboard/pms/mappings", "Mappings"],
  ["/dashboard/pms/reconciliation", "Reconciliation"],
  ["/dashboard/pms/logs", "Logs"],
  ["/dashboard/pms/errors", "Errors"],
  ["/dashboard/pms/import-export", "Import / Export"]
] as const;

export function PMSOperationsCenter({
  state,
  section
}: {
  state: PMSOperationsState;
  section: "overview" | "connections" | "sync-health" | "mappings" | "reconciliation" | "logs" | "errors" | "import-export";
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="brand-kicker">Canonical PMS Operations Center</p>
        <h1 className="mt-2 text-4xl font-black text-ink">PMS Operations</h1>
        <p className="mt-2 max-w-3xl text-base font-semibold text-muted">
          Connections, sync health, mappings, reconciliation, logs, errors, and import/export controls using the existing PMS adapter framework.
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto rounded border border-line bg-white p-2" aria-label="PMS Operations sections">
        {tabs.map(([href, label]) => (
          <Link key={href} href={href} className="shrink-0 rounded bg-paper px-3 py-2 text-xs font-black uppercase tracking-wider text-muted hover:bg-teal/10 hover:text-teal">
            {label}
          </Link>
        ))}
      </nav>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Configured PMS" value={state.configuredProviders.length} detail={`${state.providers.length} supported providers`} tone="teal" />
        <MetricCard label="Sync Health" value={`${state.syncHealth}%`} detail="Average configured provider health" tone={state.syncHealth >= 80 ? "green" : "gold"} />
        <MetricCard label="Mapping Coverage" value={state.mappings.filter(mapping => mapping.status === "mapped").length} detail="Mapped provider adapters" tone="blue" />
        <MetricCard label="Open Errors" value={state.errors.length} detail="PMS integrations below threshold" tone={state.errors.length ? "rust" : "green"} />
      </section>

      {section === "overview" || section === "connections" ? <PMSIntegrationManager state={state.cloud} /> : null}
      {section === "overview" || section === "sync-health" ? <SyncHealth state={state} /> : null}
      {section === "overview" || section === "mappings" ? <Mappings state={state} /> : null}
      {section === "overview" || section === "reconciliation" ? <Reconciliation state={state} /> : null}
      {section === "overview" || section === "logs" ? <Logs state={state} /> : null}
      {section === "overview" || section === "errors" ? <Errors state={state} /> : null}
      {section === "overview" || section === "import-export" ? <ImportExport state={state} /> : null}
    </div>
  );
}

function SyncHealth({ state }: { state: PMSOperationsState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <RefreshCw className="h-6 w-6 text-teal" />
        <h2 className="text-2xl font-black text-ink">Sync Health</h2>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {state.cloud.integrations.length ? state.cloud.integrations.map(integration => (
          <div key={integration.id} className="rounded border border-line bg-paper p-4">
            <strong className="text-ink">{integration.display_name}</strong>
            <p className="mt-1 text-sm font-semibold text-muted">{integration.status} · health {integration.health_score}%</p>
          </div>
        )) : <Empty label="No configured PMS integrations yet." />}
      </div>
    </section>
  );
}

function Mappings({ state }: { state: PMSOperationsState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Shuffle className="h-6 w-6 text-blue" />
        <h2 className="text-2xl font-black text-ink">Mappings</h2>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {state.mappings.map(mapping => (
          <div key={mapping.provider} className="flex items-center justify-between gap-3 rounded border border-line bg-paper p-4">
            <div>
              <strong className="text-ink">{mapping.provider}</strong>
              <p className="text-sm font-semibold text-muted">{mapping.canonicalEntity}</p>
            </div>
            <span className={mapping.status === "mapped" ? "text-xs font-black uppercase text-green" : "text-xs font-black uppercase text-muted"}>
              {mapping.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Reconciliation({ state }: { state: PMSOperationsState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 text-green" />
        <h2 className="text-2xl font-black text-ink">Reconciliation</h2>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <MetricCard label="Accepted" value={state.reconciliation.accepted} detail={state.reconciliation.source} tone="green" />
        <MetricCard label="Duplicates" value={state.reconciliation.duplicates} detail="Open Dental batch check" tone="gold" />
        <MetricCard label="Hash" value={state.reconciliation.hash} detail="Latest reconciliation hash" tone="blue" />
      </div>
    </section>
  );
}

function Logs({ state }: { state: PMSOperationsState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <DatabaseZap className="h-6 w-6 text-teal" />
        <h2 className="text-2xl font-black text-ink">Logs</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {state.logs.length ? state.logs.map(log => (
          <div key={log.id} className="rounded border border-line bg-paper p-4">
            <strong className="text-ink">{log.label}</strong>
            <p className="mt-1 text-sm font-semibold text-muted">{log.detail}</p>
            <p className="mt-2 text-xs font-bold text-muted">{log.at}</p>
          </div>
        )) : <Empty label="No PMS logs available." />}
      </div>
    </section>
  );
}

function Errors({ state }: { state: PMSOperationsState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <ServerCrash className="h-6 w-6 text-rust" />
        <h2 className="text-2xl font-black text-ink">Errors</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {state.errors.length ? state.errors.map(error => (
          <div key={error.id} className="flex items-start gap-3 rounded border border-rust/30 bg-rust/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-rust" />
            <div>
              <strong className="text-ink">{error.display_name}</strong>
              <p className="text-sm font-semibold text-muted">{error.status} · health {error.health_score}%</p>
            </div>
          </div>
        )) : <Empty label="No PMS errors are currently open." />}
      </div>
    </section>
  );
}

function ImportExport({ state }: { state: PMSOperationsState }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <UploadCloud className="h-6 w-6 text-teal" />
        <h2 className="text-2xl font-black text-ink">Import / Export</h2>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-line bg-paper p-4">
          <Link2 className="h-5 w-5 text-blue" />
          <strong className="mt-3 block text-ink">Import endpoint</strong>
          <p className="mt-1 text-sm font-semibold text-muted">{state.importExport.importSource}</p>
        </div>
        <div className="rounded border border-line bg-paper p-4">
          <FileDown className="h-5 w-5 text-green" />
          <strong className="mt-3 block text-ink">Export source</strong>
          <p className="mt-1 text-sm font-semibold text-muted">{state.importExport.exportSource}</p>
        </div>
      </div>
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded border border-dashed border-line bg-white p-4 text-sm font-bold text-muted">{label}</div>;
}
