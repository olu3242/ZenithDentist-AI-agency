import { Activity, AlertTriangle, BarChart3, Brain, BriefcaseBusiness, DatabaseZap, Gauge, HeartPulse, Radar, ShieldCheck, TrendingUp } from "lucide-react";
import type { EnterpriseOperationsState, EnterpriseOpsSection } from "@/lib/enterprise-operations";

export function EnterpriseOperationsCenter({ state, section }: { state: EnterpriseOperationsState; section: EnterpriseOpsSection }) {
  const title = titles[section];
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-wider text-gold">Enterprise Operations OS</p>
        <h1 className="mt-2 text-4xl font-black">{title}</h1>
        <p className="mt-2 max-w-4xl text-muted">{subtitles[section]}</p>
      </header>

      {!state.configured ? (
        <section className="rounded border border-gold/40 bg-gold/10 p-4 text-sm font-bold text-ink">
          Supabase service persistence is not configured for this runtime. The center is showing live local runtime posture plus zero-state enterprise evidence tables.
        </section>
      ) : null}

      {section === "executive" ? <Executive state={state} /> : null}
      {section === "product-owner" ? <ProductOwner state={state} /> : null}
      {section === "noc" ? <Noc state={state} /> : null}
      {section === "incidents" ? <Incidents state={state} /> : null}
      {section === "sla" ? <Sla state={state} /> : null}
      {section === "debug" ? <Debug state={state} /> : null}
      {section === "evidence" ? <Evidence state={state} /> : null}
      {section === "alice-traceability" ? <AliceTraceability state={state} /> : null}
      {section === "revenue-attribution" ? <Revenue state={state} /> : null}
      {section === "customer-success" ? <CustomerSuccess state={state} /> : null}
      {section === "agency-crm" ? <AgencyCrm state={state} /> : null}
      {section === "certification" ? <Certification state={state} /> : null}
    </div>
  );
}

function Executive({ state }: { state: EnterpriseOperationsState }) {
  return (
    <>
      <KpiGrid metrics={[
        ["Total Practices", state.kpis.totalPractices],
        ["Active Practices", state.kpis.activePractices],
        ["MRR", money(state.kpis.mrr)],
        ["ARR", money(state.kpis.arr)],
        ["Revenue Influenced", money(state.kpis.revenueInfluenced)],
        ["Automation Executions", state.kpis.automationExecutions],
        ["AI Recommendations", state.kpis.aiRecommendations],
        ["SLA Compliance", `${state.kpis.slaCompliance}%`],
        ["Readiness Index", `${state.certification.readinessIndex}/100`],
        ["Implementations", state.implementation.inProgress],
        ["Avg Days To Go Live", state.implementation.averageDaysToGoLive],
        ["Blocked Clients", state.implementation.blockedClients],
        ["Go-Live Success", `${state.implementation.goLiveSuccessRate}%`],
        ["Implementation Capacity", state.implementation.capacity],
        ["Implementation Forecast", state.implementation.forecast],
        ["Collections", money(state.commercial.collections)],
        ["Outstanding Invoices", money(state.commercial.outstandingInvoices)],
        ["Expansion Revenue", money(state.commercial.expansionRevenue)],
        ["Implementation Revenue", money(state.commercial.implementationRevenue)],
        ["Renewal Revenue", money(state.commercial.renewalRevenue)],
        ["Churn Revenue", money(state.commercial.churnRevenue)],
        ["Billable Gates", state.commercial.billableMilestones],
        ["Overdue Gates", state.commercial.overdueMilestones]
      ]} />
      <Panel title="Practice Portfolio" icon={BriefcaseBusiness}>
        <div className="grid gap-3">
          {state.portfolio.map(row => (
            <div key={row.practice} className="grid gap-3 rounded border border-line bg-white p-4 text-sm font-bold text-muted lg:grid-cols-7">
              <strong className="text-ink">{row.practice}</strong>
              <span>Health {row.health}%</span>
              <span>Revenue {money(row.revenue)}</span>
              <span>Automation {row.automation}%</span>
              <span>AI {row.aiAdoption}%</span>
              <span>Risk {row.risk}</span>
              <span>SLA {row.sla}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Forecasts state={state} />
    </>
  );
}

function ProductOwner({ state }: { state: EnterpriseOperationsState }) {
  return (
    <>
      <HealthGrid state={state} />
      <Panel title="Feature Adoption" icon={BarChart3}>
        <KpiGrid metrics={[
          ["Workflow OS", state.kpis.automationExecutions],
          ["Mission Control", state.events.length],
          ["Video Intelligence", state.evidence.find(item => item.label === "video_evidence")?.count ?? 0],
          ["Revenue OS", money(state.revenue.totalAttributed)],
          ["ALICE", state.alice.recommendations],
          ["Customer Success", state.customerSuccess.clients],
          ["Readiness Index", `${state.certification.readinessIndex}/100`]
        ]} />
      </Panel>
      <Panel title="Roadmap Center" icon={Radar}><List items={state.roadmap.map(item => `${item.label}: ${item.status} - ${item.detail}`)} /></Panel>
    </>
  );
}

function Noc({ state }: { state: EnterpriseOperationsState }) {
  return (
    <>
      <KpiGrid metrics={[
        ["Practices Online", state.kpis.activePractices],
        ["Practices Offline", Math.max(0, state.kpis.totalPractices - state.kpis.activePractices)],
        ["Automations Running", state.kpis.automationExecutions],
        ["Automations Failed", state.incidents.length],
        ["SLA Breaches", state.sla.breaches],
        ["AI Confidence", `${state.alice.averageConfidence}%`],
        ["Evidence Tables", state.evidence.length],
        ["Revenue Events", money(state.revenue.totalAttributed)],
        ["Readiness Index", `${state.certification.readinessIndex}/100`]
      ]} />
      <HealthGrid state={state} />
      <EventFeed state={state} />
    </>
  );
}

function Incidents({ state }: { state: EnterpriseOperationsState }) {
  return (
    <Panel title="Incident Management Center" icon={AlertTriangle}>
      <div className="grid gap-3">
        {state.incidents.length ? state.incidents.map(incident => (
          <div key={incident.id} className="rounded border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <strong>{incident.title}</strong>
              <span className="text-xs font-black uppercase text-rust">{incident.severity}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-muted">{incident.status} · {incident.at}</p>
          </div>
        )) : <Empty label="No active runtime incidents detected." />}
      </div>
    </Panel>
  );
}

function Sla({ state }: { state: EnterpriseOperationsState }) {
  return <KpiGrid metrics={[["Compliance", `${state.sla.compliance}%`], ["Error Budget Remaining", `${state.sla.errorBudgetRemaining}%`], ["Breaches", state.sla.breaches], ["Violations", state.sla.violations]]} />;
}

function Debug({ state }: { state: EnterpriseOperationsState }) {
  return (
    <>
      <KpiGrid metrics={[["Runtime Failures", state.incidents.length], ["Recovery Queue", state.events.filter(event => event.label.includes("recovery")).length], ["Provider Events", state.events.filter(event => event.label.includes("provider")).length], ["Debug Events", state.events.length]]} />
      <EventFeed state={state} />
    </>
  );
}

function Evidence({ state }: { state: EnterpriseOperationsState }) {
  return (
    <Panel title="Evidence Explorer" icon={DatabaseZap}>
      <div className="grid gap-3 md:grid-cols-3">
        {state.evidence.map(item => <Metric key={item.label} label={item.label} value={item.count} detail={item.status} />)}
      </div>
    </Panel>
  );
}

function AliceTraceability({ state }: { state: EnterpriseOperationsState }) {
  return <KpiGrid metrics={[["Decisions", state.alice.decisions], ["Recommendations", state.alice.recommendations], ["Outcomes", state.alice.outcomes], ["Confidence", `${state.alice.averageConfidence}%`]]} />;
}

function Revenue({ state }: { state: EnterpriseOperationsState }) {
  return <KpiGrid metrics={[["Total Attributed", money(state.revenue.totalAttributed)], ["Campaign", money(state.revenue.campaign)], ["Workflow", money(state.revenue.workflow)], ["Appointment", money(state.revenue.appointment)], ["Treatment", money(state.revenue.treatment)], ["Membership", money(state.revenue.membership)], ["Video", money(state.revenue.video)]]} />;
}

function CustomerSuccess({ state }: { state: EnterpriseOperationsState }) {
  return <KpiGrid metrics={[["Clients", state.customerSuccess.clients], ["Healthy", state.customerSuccess.healthy], ["At Risk", state.customerSuccess.atRisk], ["Expansion Candidates", state.customerSuccess.expansionCandidates], ["Renewal Risks", state.customerSuccess.renewalRisks]]} />;
}

function AgencyCrm({ state }: { state: EnterpriseOperationsState }) {
  return <KpiGrid metrics={[["Practices", state.kpis.totalPractices], ["Clients", state.customerSuccess.clients], ["MRR", money(state.kpis.mrr)], ["ARR", money(state.kpis.arr)], ["Collections", money(state.commercial.collections)], ["Outstanding", money(state.commercial.outstandingInvoices)], ["Implementation Revenue", money(state.commercial.implementationRevenue)], ["Renewal Revenue", money(state.commercial.renewalRevenue)], ["Expansion Revenue", money(state.commercial.expansionRevenue)], ["Opportunities", state.customerSuccess.expansionCandidates], ["At-Risk Accounts", state.customerSuccess.atRisk], ["Overdue Gates", state.commercial.overdueMilestones]]} />;
}

function Certification({ state }: { state: EnterpriseOperationsState }) {
  return (
    <>
      <KpiGrid metrics={[["Readiness Index", `${state.certification.readinessIndex}/100`], ["Readiness Level", state.certification.readinessLevel], ["Go-Live Gates", state.certification.gates.length], ["Passing Gates", state.certification.gates.filter(gate => gate.status === "PASS").length]]} />
      <Panel title="Production Go-Live Gates" icon={ShieldCheck}>
        <div className="grid gap-3">
          {state.certification.gates.length ? state.certification.gates.map(gate => (
            <div key={gate.subsystem} className="flex items-center justify-between gap-4 rounded border border-line bg-white p-4">
              <div>
                <strong className="text-ink">{gate.subsystem}</strong>
                <p className="text-sm font-semibold text-muted">Required threshold {gate.threshold}%</p>
              </div>
              <span className={gate.status === "PASS" ? "text-sm font-black text-green" : gate.status === "WARN" ? "text-sm font-black text-gold" : "text-sm font-black text-rust"}>
                {gate.status} · {gate.score}%
              </span>
            </div>
          )) : <Empty label="No certification run has been persisted yet." />}
        </div>
      </Panel>
    </>
  );
}

function Forecasts({ state }: { state: EnterpriseOperationsState }) {
  return (
    <Panel title="ALICE Executive Forecasting" icon={Brain}>
      <List items={[
        `Churn risk: ${state.customerSuccess.atRisk} account signal(s)`,
        `Expansion opportunity: ${state.customerSuccess.expansionCandidates} candidate(s)`,
        `Revenue forecast: ${money(state.kpis.arr)} attributed ARR base`,
        `Operational risk forecast: ${state.incidents.length + state.sla.breaches} active risk signal(s)`,
        `Utilization forecast: ${state.kpis.automationExecutions} automation execution(s)`,
        `Implementation forecast: ${state.implementation.forecast} client(s) before go-live`,
        `Billing risk: ${state.commercial.overdueMilestones} overdue gate(s) and ${money(state.commercial.outstandingInvoices)} outstanding`
      ]} />
    </Panel>
  );
}

function HealthGrid({ state }: { state: EnterpriseOperationsState }) {
  return (
    <Panel title="Platform Health" icon={ShieldCheck}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {state.platformHealth.map(item => <Metric key={item.label} label={item.label} value={`${item.score}%`} detail={`${item.status}: ${item.detail}`} />)}
      </div>
    </Panel>
  );
}

function EventFeed({ state }: { state: EnterpriseOperationsState }) {
  return (
    <Panel title="Live Event Feed" icon={Activity}>
      <div className="grid gap-3">
        {state.events.length ? state.events.map(event => (
          <div key={event.id} className="rounded border border-line bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <strong>{event.label}</strong>
              <span className="text-xs font-black uppercase text-muted">{event.severity}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-muted">{event.detail}</p>
          </div>
        )) : <Empty label="No event fabric records are currently available." />}
      </div>
    </Panel>
  );
}

function KpiGrid({ metrics }: { metrics: Array<[string, string | number]> }) {
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</section>;
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <article className="rounded border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-ink">{value}</strong>
      {detail ? <p className="mt-2 text-sm font-semibold text-muted">{detail}</p> : null}
    </article>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Gauge; children: React.ReactNode }) {
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

function List({ items }: { items: string[] }) {
  return <div className="grid gap-2">{items.map(item => <p key={item} className="rounded bg-paper px-3 py-2 text-sm font-bold text-muted">{item}</p>)}</div>;
}

function Empty({ label }: { label: string }) {
  return <div className="rounded border border-dashed border-line bg-paper p-4 text-sm font-bold text-muted">{label}</div>;
}

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

const titles: Record<EnterpriseOpsSection, string> = {
  executive: "Executive Command Center",
  "product-owner": "Product Owner Command Center",
  noc: "Enterprise NOC",
  incidents: "Incident Management Center",
  sla: "SLA Management Center",
  debug: "Debug & Recovery Center",
  evidence: "Evidence OS",
  "alice-traceability": "ALICE Traceability Center",
  "revenue-attribution": "Revenue Attribution Engine",
  "customer-success": "Customer Success OS",
  "agency-crm": "Agency CRM",
  certification: "Enterprise Certification Center"
};

const subtitles: Record<EnterpriseOpsSection, string> = {
  executive: "Agency-wide executive oversight across practices, revenue, automation, AI, incidents, and SLA compliance.",
  "product-owner": "Operate Zenith itself through platform health, feature adoption, roadmap posture, and tenant analytics.",
  noc: "Real-time operational command center for runtime, integrations, AI, database, and delivery health.",
  incidents: "Open, assign, escalate, recover, close, and analyze incidents across Runtime OS and Mission Control.",
  sla: "Track availability, response, resolution, recovery, error budgets, and SLA compliance by organization.",
  debug: "Detect, classify, recover, validate, and close system failures with traceable recovery actions.",
  evidence: "Evidence explorer for automation, workflow, revenue, patient journey, relationship, video, ALICE, LIZ, and compliance proof.",
  "alice-traceability": "Decision registry, recommendation timeline, outcome tracking, and confidence analytics for ALICE.",
  "revenue-attribution": "Revenue journey tracker across campaign, workflow, appointment, treatment, membership, and video attribution.",
  "customer-success": "Health, adoption, expansion, churn, renewal, and engagement posture for managed practices.",
  "agency-crm": "Pipeline, clients, contracts, renewals, expansions, opportunities, MRR, ARR, and at-risk accounts.",
  certification: "Evidence, revenue attribution, ALICE, incident, recovery, and SLA coverage gates for production certification."
};
