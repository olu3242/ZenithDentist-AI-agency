import { MetricCard } from "@/components/metric-card";
import { RealtimeRefresh } from "@/components/portal/realtime-refresh";
import { getLeadOperationsState, outreachStages } from "@/lib/lead-operations";

export default async function LeadOperationsPage() {
  const state = await getLeadOperationsState();
  return (
    <main className="min-h-screen bg-background p-5 lg:p-8">
      <RealtimeRefresh />
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs font-black uppercase tracking-wider text-accent">Zenith AI Automation Agency</p>
          <h1 className="mt-2 text-4xl font-black text-[#F8FAFC]">Lead Operations</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">Dental client acquisition, prospect management, reply/book rates, campaign visibility, and revenue-focused personalization.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Prospects" value={state.metrics.prospects} detail="Lead records" tone="accent" />
          <MetricCard label="Reply rate" value={`${state.metrics.replyRate}%`} detail="Tracked outreach replies" tone="success" />
          <MetricCard label="Booked calls" value={state.metrics.bookedCalls} detail="Booking activity" tone="primary" />
          <MetricCard label="Campaign health" value={`${state.metrics.campaignHealth}%`} detail="Runtime-derived score" tone="warning" />
          <MetricCard label="Priority score" value={`${state.metrics.prioritizationScore}%`} detail="Reply, booking, and proposal lift" tone="danger" />
        </div>
        <section className="rounded border border-card bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-muted">Outreach pipeline</p>
          <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Stage distribution</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {outreachStages.map(stage => (
              <div key={stage} className="rounded border border-card bg-background p-4">
                <p className="text-sm font-black text-[#F8FAFC]">{stage}</p>
                <p className="mt-2 text-3xl font-black text-accent">{state.stageCounts[stage]}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded border border-card bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-muted">Prospect enrichment</p>
          <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">Lead prioritization and outreach suggestions</h2>
          <div className="mt-5 grid gap-3">
            {state.prioritizedLeads.map(lead => (
              <div key={lead.id} className="grid gap-3 rounded border border-card bg-background p-4 md:grid-cols-[1fr_90px_120px] md:items-center">
                <div>
                  <strong className="text-sm font-black text-[#F8FAFC]">{lead.practiceName}</strong>
                  <p className="mt-1 text-sm font-semibold text-muted">{lead.suggestion}</p>
                </div>
                <span className="text-xl font-black text-accent">{lead.score}</span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-muted">{lead.status}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded border border-card bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-muted">Personalization workflow</p>
          <h2 className="mt-1 text-2xl font-black text-[#F8FAFC]">{state.workflow?.name ?? "Lead Created"}</h2>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <div className="rounded border border-card bg-background p-4">
              <h3 className="font-black text-[#F8FAFC]">Queue handlers</h3>
              <ul className="mt-3 grid gap-2 text-sm font-semibold text-muted">
                {(state.workflow?.queueHandlers ?? []).map(handler => <li key={handler}>{handler}</li>)}
              </ul>
            </div>
            <div className="rounded border border-card bg-background p-4">
              <h3 className="font-black text-[#F8FAFC]">Outreach cadence</h3>
              <ul className="mt-3 grid gap-2 text-sm font-semibold text-muted">
                {state.cadenceRecommendations.map(output => <li key={output}>{output}</li>)}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
