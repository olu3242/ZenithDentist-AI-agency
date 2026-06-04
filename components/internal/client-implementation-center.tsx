import { Activity, BookOpenCheck, CalendarCheck, CheckCircle2, ClipboardCheck, GraduationCap, PlugZap, Rocket, ShieldCheck, Users } from "lucide-react";
import type { ClientImplementationState, ImplementationSection } from "@/lib/client-implementation-os";

export function ClientImplementationCenter({ state, section }: { state: ClientImplementationState; section: ImplementationSection }) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-wider text-gold">Client Implementation OS</p>
        <h1 className="mt-2 text-4xl font-black">{titles[section]}</h1>
        <p className="mt-2 max-w-4xl text-muted">{subtitles[section]}</p>
      </header>

      {!state.configured ? (
        <section className="rounded border border-gold/40 bg-gold/10 p-4 text-sm font-bold text-ink">
          Supabase service persistence is not configured. This center is showing the implementation operating model with no persisted client rows.
        </section>
      ) : null}

      {section === "implementations" ? <ImplementationCommand state={state} /> : null}
      {section === "onboarding" ? <Onboarding state={state} /> : null}
      {section === "integrations-readiness" ? <Integrations state={state} /> : null}
      {section === "training" ? <Training state={state} /> : null}
      {section === "adoption" ? <Adoption state={state} /> : null}
      {section === "go-live" ? <GoLive state={state} /> : null}
      {section === "client-playbooks" ? <ClientPlaybooks state={state} /> : null}
    </div>
  );
}

function ImplementationCommand({ state }: { state: ClientImplementationState }) {
  return (
    <>
      <KpiGrid metrics={[
        ["In Progress", state.executiveMetrics.implementationsInProgress],
        ["Avg Days To Go Live", state.executiveMetrics.averageDaysToGoLive],
        ["Blocked Clients", state.executiveMetrics.blockedClients],
        ["Go-Live Success", `${state.executiveMetrics.goLiveSuccessRate}%`],
        ["Capacity", state.executiveMetrics.implementationCapacity],
        ["Forecast", state.executiveMetrics.implementationForecast]
      ]} />
      <Panel title="Implementation Portfolio" icon={Rocket}>
        <div className="grid gap-3">
          {state.projects.length ? state.projects.map(project => (
            <Row key={project.id} columns={[project.clientName, project.packageKey, project.owner, project.phase, project.goLiveDate, project.riskLevel, `${project.completion}%`]} />
          )) : <Empty label="No implementation projects have been created yet." />}
        </div>
      </Panel>
      <Panel title="Implementation Blueprints" icon={ClipboardCheck}>
        <div className="grid gap-4 lg:grid-cols-3">
          {state.blueprints.map(blueprint => (
            <article key={blueprint.key} className="rounded border border-line bg-white p-4">
              <h2 className="text-lg font-black text-ink">{blueprint.name}</h2>
              <List items={[...blueprint.integrations.slice(0, 3), ...blueprint.workflows.slice(0, 2)]} />
            </article>
          ))}
        </div>
      </Panel>
    </>
  );
}

function Onboarding({ state }: { state: ClientImplementationState }) {
  return (
    <>
      <KpiGrid metrics={[
        ["Required Items", state.onboarding.filter(item => item.required).length],
        ["Completed", state.onboarding.filter(item => item.status === "completed").length],
        ["Blocked", state.onboarding.filter(item => item.status === "blocked").length],
        ["Open Tasks", state.tasks.filter(task => task.status !== "completed").length],
        ["Evidence Required", state.onboarding.filter(item => item.evidenceStatus === "required").length],
        ["Go-Live Gates", state.onboarding.filter(item => item.goLiveRequirement).length]
      ]} />
      <Panel title="Client Onboarding Checklist" icon={ClipboardCheck}>
        <Rows rows={state.onboarding.map(item => [item.label, item.stage, item.owner || item.ownerRole, item.dueDate, item.evidenceType, item.evidenceStatus, item.goLiveRequirement ? "go-live gate" : item.status])} empty="No onboarding checklist rows are persisted yet." />
      </Panel>
      <Panel title="Generated Checklist Tasks" icon={CheckCircle2}>
        <Rows rows={state.tasks.map(task => [task.title, task.type, task.owner || task.ownerRole, task.dueDate, task.evidenceType, task.evidenceStatus, task.goLiveRequirement ? "go-live gate" : task.status])} empty="No implementation checklist tasks are persisted yet." />
      </Panel>
    </>
  );
}

function Integrations({ state }: { state: ClientImplementationState }) {
  return (
    <>
      <KpiGrid metrics={[
        ["Connected", state.integrations.filter(item => item.status === "connected").length],
        ["Pending", state.integrations.filter(item => item.status === "pending").length],
        ["Failed", state.integrations.filter(item => item.status === "failed").length],
        ["Not Started", state.integrations.filter(item => item.status === "not_started").length]
      ]} />
      <Panel title="Integration Readiness" icon={PlugZap}>
        <Rows rows={state.integrations.map(item => [item.provider, item.status, item.failureReason || "No failure recorded"])} empty="No integration readiness checks are persisted yet." />
      </Panel>
    </>
  );
}

function Training({ state }: { state: ClientImplementationState }) {
  return (
    <>
      <KpiGrid metrics={[
        ["Assigned", state.training.filter(item => item.status === "assigned").length],
        ["Started", state.training.filter(item => item.status === "started").length],
        ["Completed", state.training.filter(item => item.status === "completed").length],
        ["Certified", state.training.filter(item => item.status === "certified").length]
      ]} />
      <Panel title="Training Assignments" icon={GraduationCap}>
        <Rows rows={state.training.map(item => [item.participant, item.track, item.status])} empty="No training assignments are persisted yet." />
      </Panel>
    </>
  );
}

function Adoption({ state }: { state: ClientImplementationState }) {
  return (
    <>
      <KpiGrid metrics={[
        ["Tracked Clients", state.adoption.length],
        ["Healthy Adoption", state.adoption.filter(item => item.classification === "healthy_adoption").length],
        ["Low Adoption", state.adoption.filter(item => item.classification === "low_adoption").length],
        ["Expansion Signals", state.health.filter(item => item.expansionScore >= 75).length]
      ]} />
      <Panel title="Adoption Intelligence" icon={Activity}>
        <Rows rows={state.adoption.map(item => [`Score ${item.score}`, item.classification, `${item.workflowUsage} workflow uses`, `${item.aliceUsage} AI Revenue Intelligence uses`])} empty="No adoption measurements are persisted yet." />
      </Panel>
      <Panel title="Client Health Rollups" icon={Users}>
        <Rows rows={state.health.map(item => [`Health ${item.healthScore}`, `Risk ${item.riskScore}`, `Expansion ${item.expansionScore}`])} empty="No client health rollups are persisted yet." />
      </Panel>
    </>
  );
}

function GoLive({ state }: { state: ClientImplementationState }) {
  return (
    <>
      <KpiGrid metrics={[
        ["Certified", state.goLive.filter(item => item.certified).length],
        ["Awaiting Certification", state.goLive.filter(item => !item.certified).length],
        ["Avg Readiness", average(state.goLive.map(item => item.readiness)) + "%"],
        ["Success Reviews", state.reviews.length],
        ["Open Go-Live Gates", state.onboarding.filter(item => item.goLiveRequirement && item.status !== "completed").length],
        ["Missing Evidence", state.onboarding.filter(item => item.goLiveRequirement && item.evidenceStatus === "required").length]
      ]} />
      <Panel title="Go-Live Certification Gates" icon={ShieldCheck}>
        <Rows rows={state.goLive.map(item => [item.certified ? "Certified" : "Pending", `${item.readiness}% ready`, item.certifiedAt])} empty="No go-live checklists are persisted yet." />
      </Panel>
      <Panel title="Checklist Requirements Blocking Go-Live" icon={CheckCircle2}>
        <Rows rows={state.onboarding.filter(item => item.goLiveRequirement).map(item => [item.label, item.stage, item.owner || item.ownerRole, item.dueDate, item.evidenceType, item.evidenceStatus, item.status])} empty="No go-live checklist requirements are persisted yet." />
      </Panel>
      <Panel title="Customer Success Automation" icon={CalendarCheck}>
        <Rows rows={state.reviews.map(item => [item.type, item.status, item.scheduledAt])} empty="No automated success reviews are scheduled yet." />
      </Panel>
    </>
  );
}

function ClientPlaybooks({ state }: { state: ClientImplementationState }) {
  const completed = state.operatingPlaybooks.filter(item => item.status === "completed").length;
  return (
    <>
      <KpiGrid metrics={[
        ["Lifecycle Stages", 6],
        ["Playbook Templates", state.operatingPlaybookTemplates.length],
        ["Operating Items", state.operatingPlaybooks.length],
        ["Completed Items", completed],
        ["Evidence Required", state.operatingPlaybooks.filter(item => item.evidenceStatus === "required").length],
        ["Open Items", state.operatingPlaybooks.filter(item => item.status !== "completed").length],
        ["Healthy Criteria", 6],
        ["Completion", state.operatingPlaybooks.length ? `${Math.round((completed / state.operatingPlaybooks.length) * 100)}%` : "0%"]
      ]} />
      <Panel title="Standard Client Operating Playbooks" icon={BookOpenCheck}>
        <div className="grid gap-4 lg:grid-cols-2">
          {state.operatingPlaybookTemplates.map(playbook => (
            <article key={playbook.key} className="rounded border border-line bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wider text-muted">{playbook.lifecycleStage} · {playbook.cadence}</p>
              <h2 className="mt-2 text-lg font-black text-ink">{playbook.name}</h2>
              <p className="mt-2 text-sm font-semibold text-muted">{playbook.objective}</p>
              <List items={playbook.successMetrics} />
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Executable Playbook Checklist" icon={CheckCircle2}>
        <Rows rows={state.operatingPlaybooks.map(item => [item.label, item.stage, item.section, item.owner || item.ownerRole, item.dueDate, item.evidenceType, item.status])} empty="No client operating playbook items are persisted yet." />
      </Panel>
      <Panel title="Healthy Client Criteria" icon={ShieldCheck}>
        <Rows rows={[
          ["Health Score > 80", "Customer Success OS", "monthly review"],
          ["Adoption Score > 75", "Adoption Engine", "monthly review"],
          ["Workflow Usage > 70%", "Automation Platform", "monthly review"],
          ["Revenue Attribution Active", "Evidence OS", "monthly review"],
          ["No Critical Incidents", "Executive Dashboard", "continuous"],
          ["SLA Compliance > 95%", "SLA Center", "continuous"]
        ]} empty="Healthy client criteria are unavailable." />
      </Panel>
    </>
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

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof CheckCircle2; children: React.ReactNode }) {
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

function Rows({ rows, empty }: { rows: string[][]; empty: string }) {
  return <div className="grid gap-3">{rows.length ? rows.map(row => <Row key={row.join(":")} columns={row} />) : <Empty label={empty} />}</div>;
}

function Row({ columns }: { columns: Array<string | number> }) {
  return <div className="grid gap-2 rounded border border-line bg-white p-4 text-sm font-bold text-muted md:grid-cols-3 xl:grid-cols-7">{columns.map(column => <span key={String(column)}>{column}</span>)}</div>;
}

function List({ items }: { items: string[] }) {
  return <div className="mt-3 grid gap-2">{items.map(item => <p key={item} className="rounded bg-paper px-3 py-2 text-sm font-bold text-muted">{item}</p>)}</div>;
}

function Empty({ label }: { label: string }) {
  return <div className="rounded border border-dashed border-line bg-paper p-4 text-sm font-bold text-muted">{label}</div>;
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

const titles: Record<ImplementationSection, string> = {
  implementations: "Implementation Command Center",
  onboarding: "Client Onboarding Engine",
  "integrations-readiness": "Integration Readiness Center",
  training: "Training OS",
  adoption: "Adoption Engine",
  "go-live": "Go-Live Certification",
  "client-playbooks": "Client Operating Playbooks"
};

const subtitles: Record<ImplementationSection, string> = {
  implementations: "Track package, owner, phase, risk, completion, go-live date, capacity, and implementation forecast for every client.",
  onboarding: "Automate practice information, provider data, locations, Google, PMS, Stripe, Calendly, email, and SMS readiness.",
  "integrations-readiness": "Verify Open Dental, Stripe, Google, Meta, Calendly, email, SMS, and WhatsApp connection posture.",
  training: "Assign and certify role-based training for practice owners, office managers, front desk teams, and providers.",
  adoption: "Measure login frequency, workflow usage, AI Revenue Intelligence usage, revenue dashboard usage, video usage, and treatment acceptance adoption.",
  "go-live": "Enforce integration, workflow, template, training, and testing gates before client go-live.",
  "client-playbooks": "Standardize Day 1 activation, week 1 validation, success reviews, optimization, incident response, renewal, and expansion procedures."
};
