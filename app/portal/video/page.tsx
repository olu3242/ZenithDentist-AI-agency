import { PlayCircle, Sparkles, Target, TrendingUp } from "lucide-react";
import { DashboardContainer, DashboardGrid, KpiGrid } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { getVideoEngagementState } from "@/lib/video-engagement-os";

export default async function VideoIntelligenceCenterPage() {
  const state = await getVideoEngagementState();

  return (
    <DashboardContainer>
      <PortalHeader title="Video Intelligence Center" subtitle="Patient journeys, engagement scoring, relationship health, ALICE optimization, and revenue attribution." />
      <KpiGrid>
        <Kpi label="Videos Generated" value={state.kpis.videosGenerated} />
        <Kpi label="Open Rate" value={`${state.kpis.openRate}%`} />
        <Kpi label="Completion Rate" value={`${state.kpis.completionRate}%`} />
        <Kpi label="Confirmations" value={state.kpis.appointmentConfirmations} />
      </KpiGrid>
      <KpiGrid>
        <Kpi label="Recall Conversions" value={state.kpis.recallConversions} />
        <Kpi label="Reactivations" value={state.kpis.reactivationConversions} />
        <Kpi label="Review Conversions" value={state.kpis.reviewConversions} />
        <Kpi label="Referral Conversions" value={state.kpis.referralConversions} />
      </KpiGrid>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Attention Score" value={`${state.kpis.averageAttentionScore}/100`} />
        <Kpi label="Relationship Health" value={`${state.kpis.averageRelationshipHealth}/100`} />
        <RevenueCard label="Revenue Influenced" value={state.kpis.revenueInfluenced} />
        <RevenueCard label="Revenue Recovered" value={state.kpis.revenueRecovered} />
      </section>
      <DashboardGrid>
        <section className="brand-panel rounded p-5">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-teal" />
            <h2 className="text-xl font-black">Patient Journey Engine</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {state.journeys.map(journey => (
              <article key={journey.key} className="rounded border border-line bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-black text-ink">{journey.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-muted">{journey.objective}</p>
                    <p className="mt-2 text-xs font-black uppercase tracking-wider text-muted">{journey.trigger}</p>
                  </div>
                  <span className="rounded bg-paper px-3 py-1 text-xs font-black uppercase text-teal">{journey.workflowId}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="brand-panel rounded p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal" />
            <h2 className="text-xl font-black">ALICE Video Intelligence</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {state.recommendations.map(recommendation => (
              <article key={recommendation.id} className="rounded border border-line bg-white p-4">
                <div className="flex gap-3">
                  <Target className="mt-1 h-4 w-4 shrink-0 text-teal" />
                  <div>
                    <h3 className="text-sm font-black text-ink">{recommendation.journeyRecommendation}</h3>
                    <p className="mt-1 text-sm font-semibold text-muted">{recommendation.videoRecommendation}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 rounded bg-paper px-3 py-2 text-sm font-bold text-muted">
                      <span>{recommendation.expectedRevenueImpact}</span>
                      <span>{recommendation.confidenceScore}%</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </DashboardGrid>
      {!state.configured ? (
        <section className="rounded border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Configure Supabase service credentials and apply the Video Engagement OS migration to activate live patient journey data.
        </section>
      ) : null}
    </DashboardContainer>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="brand-panel rounded p-4">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-ink">{value}</strong>
    </article>
  );
}

function RevenueCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="brand-panel rounded p-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-teal" />
        <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      </div>
      <strong className="mt-2 block text-2xl font-black text-teal">${value.toLocaleString()}</strong>
    </article>
  );
}
