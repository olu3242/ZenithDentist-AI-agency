import { DollarSign, FileCheck2, LockKeyhole, Receipt, ShieldCheck } from "lucide-react";
import type { CommercialLockdownState } from "@/lib/commercial-lockdown";

export function CommercialLockdownCenter({ state }: { state: CommercialLockdownState }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-wider text-gold">Commercial Lockdown Framework</p>
        <h1 className="mt-2 text-4xl font-black">Financial Control Center</h1>
        <p className="mt-2 max-w-4xl text-muted">
          Deliverable-based pricing, payment gates, scope protection, expansion billing, offboarding controls, and client revenue visibility.
        </p>
      </header>

      {!state.configured ? (
        <section className="rounded border border-gold/40 bg-gold/10 p-4 text-sm font-bold text-ink">
          Supabase service persistence is not configured. Commercial package policy is visible, but client controls and billing records are zero-state.
        </section>
      ) : null}

      <KpiGrid metrics={[
        ["MRR", money(state.metrics.mrr)],
        ["ARR", money(state.metrics.arr)],
        ["Collections", money(state.metrics.collections)],
        ["Outstanding", money(state.metrics.outstandingInvoices)],
        ["Expansion Revenue", money(state.metrics.expansionRevenue)],
        ["Implementation Revenue", money(state.metrics.implementationRevenue)],
        ["Renewal Revenue", money(state.metrics.renewalRevenue)],
        ["Churn Revenue", money(state.metrics.churnRevenue)],
        ["Billable Gates", state.metrics.billableMilestones],
        ["Overdue Gates", state.metrics.overdueMilestones],
        ["Change Requests", state.metrics.changeRequests],
        ["Expansion Quotes", state.metrics.expansionQuotes]
      ]} />

      <Panel title="Commercial Packages" icon={LockKeyhole}>
        <div className="grid gap-4 lg:grid-cols-3">
          {state.packages.map(pkg => (
            <article key={pkg.key} className="rounded border border-line bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wider text-muted">{pkg.sla}</p>
              <h2 className="mt-2 text-lg font-black text-ink">{pkg.name}</h2>
              <p className="mt-2 text-sm font-bold text-muted">Setup {money(pkg.setupFee)} · Monthly {money(pkg.monthlyFee)}</p>
              <List items={pkg.paymentGates.map(gate => `${gate.percentage}% ${gate.name}: ${gate.criteria.join(", ")}`)} />
            </article>
          ))}
        </div>
      </Panel>

      <Panel title="Client Commercial Visibility" icon={DollarSign}>
        <Rows rows={state.clients.map(client => [client.packageKey, client.legalEntity, client.billingEntity, money(client.contractValue), client.implementationStatus, client.goLiveStatus, money(client.monthlyRevenue), client.renewalDate, `Health ${client.healthScore}`, client.riskStatus])} empty="No client commercial controls are persisted yet." />
      </Panel>

      <Panel title="Payment Gates" icon={Receipt}>
        <Rows rows={state.milestones.map(item => [item.gate, money(item.amount), item.dueDate, item.status, item.blockedReason || "No blocker"])} empty="No payment milestones are persisted yet." />
      </Panel>

      <Panel title="Scope Protection" icon={ShieldCheck}>
        <Rows rows={state.changeRequests.map(item => [item.title, item.scope, item.status, money(item.amount)])} empty="No change requests are open." />
      </Panel>

      <Panel title="Expansion & Offboarding Controls" icon={FileCheck2}>
        <Rows rows={[
          ...state.expansionQuotes.map(item => [`Expansion: ${item.type}`, money(item.amount), item.status]),
          ...state.offboarding.map(item => [`Offboarding: ${item.status}`, item.noticeReceived ? "30-day notice" : "notice missing", item.balancePaid ? "balance paid" : "balance open", item.exportGenerated ? "export ready" : "export pending", item.complete ? "complete" : "open"])
        ]} empty="No expansion quotes or offboarding controls are active." />
      </Panel>
    </div>
  );
}

function KpiGrid({ metrics }: { metrics: Array<[string, string | number]> }) {
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</section>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-ink">{value}</strong>
    </article>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof DollarSign; children: React.ReactNode }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-teal" />
        <h2 className="text-xl font-black text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Rows({ rows, empty }: { rows: Array<Array<string | number>>; empty: string }) {
  return <div className="grid gap-3">{rows.length ? rows.map(row => <Row key={row.join(":")} columns={row} />) : <Empty label={empty} />}</div>;
}

function Row({ columns }: { columns: Array<string | number> }) {
  return <div className="grid gap-2 rounded border border-line bg-white p-4 text-sm font-bold text-muted md:grid-cols-3 xl:grid-cols-8">{columns.map(column => <span key={String(column)}>{column}</span>)}</div>;
}

function List({ items }: { items: string[] }) {
  return <div className="mt-3 grid gap-2">{items.map(item => <p key={item} className="rounded bg-paper px-3 py-2 text-sm font-bold text-muted">{item}</p>)}</div>;
}

function Empty({ label }: { label: string }) {
  return <div className="rounded border border-dashed border-line bg-paper p-4 text-sm font-bold text-muted">{label}</div>;
}

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}
