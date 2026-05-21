import { MetricCard } from "@/components/metric-card";
import { ClientMaturityCard } from "@/components/mission-control/client-maturity-card";
import { DentalIntelligencePanel } from "@/components/mission-control/dental-intelligence-panel";
import { ExecutiveReportCard } from "@/components/mission-control/executive-report-card";
import { ProviderHealthPanel } from "@/components/mission-control/provider-health-panel";
import { RuntimeHeatmap } from "@/components/mission-control/runtime-heatmap";
import { getClientOperationsState } from "@/lib/client-operations";
import { generateDentalOperationalPredictions } from "@/lib/runtime/dental-intelligence";
import { buildExecutiveReportSnapshot } from "@/lib/runtime/executive-reporting";
import { getProviderHealth } from "@/lib/runtime/provider-health";

export default async function ClientOperationsPage() {
  const [state, providers, report, dentalPredictions] = await Promise.all([
    getClientOperationsState(),
    getProviderHealth(),
    buildExecutiveReportSnapshot(),
    generateDentalOperationalPredictions()
  ]);
  return (
    <main className="min-h-screen bg-paper p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs font-black uppercase tracking-wider text-teal">Client operations layer</p>
          <h1 className="mt-2 text-4xl font-black text-ink">{state.organization.name}</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">Executive operational reporting across runtime health, patient engagement, recall, SLA compliance, provider reliability, and revenue recovery.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Operational score" value={`${state.scores.operationalScore}%`} detail="Client operating posture" tone="teal" />
          <MetricCard label="Maturity score" value={`${state.scores.automationMaturityScore}%`} detail="Registry + runtime coverage" tone="blue" />
          <MetricCard label="Engagement" value={`${state.scores.engagementScore}%`} detail="Patient engagement" tone="green" />
          <MetricCard label="Automation ROI" value={`$${Math.round(state.scores.automationRoi).toLocaleString()}`} detail="Recovered revenue" tone="gold" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientMaturityCard title="Operational maturity" score={state.scores.automationMaturityScore} detail="Registry coverage, replay readiness, and observability depth." />
          <ClientMaturityCard title="Reliability" score={state.scores.reliabilityScore} detail="Runtime success, retry pressure, and unresolved failures." />
          <ClientMaturityCard title="SLA compliance" score={state.scores.slaCompliance} detail="Client-facing timing discipline across active traces." />
          <ClientMaturityCard title="Engagement" score={state.scores.engagementScore} detail="Patient engagement and retention signal strength." />
        </div>
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-muted">Automation health by client</p>
          <h2 className="mt-1 text-2xl font-black text-ink">Domain reliability</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {state.clientHealth.map(domain => (
              <div key={domain.domain} className="rounded border border-line bg-paper p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm font-black text-ink">{domain.domain.replace(/_/g, " ")}</strong>
                  <span className="text-xl font-black text-teal">{domain.reliabilityScore}%</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-muted">{domain.workflowCount} workflows · {domain.successRate}% success · {domain.alerts} alerts</p>
              </div>
            ))}
          </div>
        </section>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <RuntimeHeatmap state={state.runtime} />
          <ProviderHealthPanel providers={providers} />
        </div>
        <DentalIntelligencePanel predictions={dentalPredictions} />
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <ExecutiveReportCard report={report} />
          <section className="rounded border border-line bg-ink p-5 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-white/55">ALICE client recommendations</p>
            <h2 className="mt-1 text-2xl font-black">Operational priorities</h2>
            <div className="mt-5 grid gap-3">
              {state.recommendations.map(item => (
                <div key={item} className="rounded border border-white/10 bg-white/8 p-4 text-sm font-semibold text-white/75">{item}</div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
