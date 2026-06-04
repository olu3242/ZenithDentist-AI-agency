import { BarChart3, BookOpen, HeartPulse, PlayCircle, Sparkles, Target, TrendingUp, Wallet } from "lucide-react";
import { DashboardContainer, DashboardGrid, KpiGrid } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { getVideoIntelligenceState } from "@/lib/video-intelligence";

export default async function VideoIntelligenceCenterPage() {
  const state = await getVideoIntelligenceState();

  return (
    <DashboardContainer>
      <PortalHeader
        title="Video Intelligence Center"
        subtitle="Patient education, influence journeys, behavioral signals, attribution, and AI Revenue Intelligence recommendations."
      />

      <KpiGrid>
        <Kpi label="Videos Sent" value={state.kpis.videosSent} />
        <Kpi label="Videos Viewed" value={state.kpis.videosViewed} />
        <Kpi label="Completion Rate" value={`${state.kpis.completionRate}%`} />
        <Kpi label="Attention Score" value={`${state.kpis.averageAttentionScore}/100`} />
      </KpiGrid>

      <KpiGrid>
        <Kpi label="Treatment Readiness" value={`${state.kpis.treatmentReadiness}%`} />
        <Kpi label="Membership Readiness" value={`${state.kpis.membershipReadiness}%`} />
        <Kpi label="Reviews Generated" value={state.kpis.reviewsGenerated} />
        <Kpi label="Referrals Generated" value={state.kpis.referralsGenerated} />
      </KpiGrid>

      <section className="grid gap-4 md:grid-cols-3">
        <RevenueCard label="Revenue Influenced" value={state.kpis.revenueInfluenced} />
        <RevenueCard label="Revenue Recovered" value={state.kpis.revenueRecovered} />
        <RevenueCard label="Revenue Protected" value={state.kpis.revenueProtected} />
      </section>

      <DashboardGrid>
        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-teal" />
            <h2 className="text-xl font-black text-ink">Smart Video Journeys</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {state.journeys.map(journey => (
              <article key={journey.id} className="rounded border border-line bg-paper p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-black text-ink">{journey.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-muted">{journey.primaryOutcome}</p>
                  </div>
                  <span className="rounded bg-white px-3 py-1 text-xs font-black uppercase text-teal">{journey.workflowId}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {journey.stages.map(stage => (
                    <span key={stage} className="rounded border border-line bg-white px-3 py-1 text-xs font-bold text-muted">{stage}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal" />
            <h2 className="text-xl font-black text-ink">Video Revenue Intelligence</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {state.recommendations.map(recommendation => (
              <article key={recommendation.id} className="rounded border border-line bg-paper p-4">
                <div className="flex items-start gap-3">
                  <Target className="mt-1 h-4 w-4 shrink-0 text-teal" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-ink">{recommendation.action}</h3>
                    <p className="mt-1 text-sm font-semibold text-muted">{recommendation.problem}</p>
                    <p className="mt-2 text-xs font-black uppercase tracking-wider text-muted">{recommendation.impact}</p>
                    <div className="mt-3 flex items-center justify-between gap-3 rounded bg-white px-3 py-2 text-sm font-bold text-muted">
                      <span>{recommendation.workflowId}</span>
                      <span>{recommendation.confidence}% confidence</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </DashboardGrid>

      <DashboardGrid>
        <CapabilityPanel
          icon={HeartPulse}
          title="Patient Influence Engine"
          items={[
            "Maps PMS and patient lifecycle signals to the right video journey.",
            "Uses attention, relationship health, retention risk, and readiness scores.",
            "Feeds AI Revenue Intelligence recommendations and Automation Platform launches."
          ]}
        />
        <CapabilityPanel
          icon={Target}
          title="Treatment Acceptance Accelerator"
          items={[
            "Sequences procedure education, benefits, financing guidance, and success-story videos.",
            "Prioritizes unscheduled and high-value treatment plans.",
            "Tracks treatment readiness and accepted-treatment outcomes."
          ]}
        />
        <CapabilityPanel
          icon={Wallet}
          title="Video Attribution Engine"
          items={[
            "Connects video delivery, engagement, CTA clicks, outcomes, and revenue records.",
            "Separates revenue influenced, revenue recovered, and revenue protected.",
            "Feeds evidence, reporting, Executive Dashboard, and executive revenue visibility."
          ]}
        />
        <CapabilityPanel
          icon={BookOpen}
          title="Provider Video Library"
          items={[
            "Supports welcome, cleaning, treatment, financing, review, referral, and follow-up videos.",
            "Keeps provider-personalized content available for journey orchestration.",
            "Grounds advisor responses in approved video journey capabilities."
          ]}
        />
      </DashboardGrid>

      {!state.configured ? (
        <section className="rounded border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          Video Intelligence is running in design-certified mode. Configure Supabase service credentials and apply the video migration to activate live patient journey data.
        </section>
      ) : null}
    </DashboardContainer>
  );
}

function CapabilityPanel({ icon: Icon, title, items }: { icon: typeof BarChart3; title: string; items: string[] }) {
  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-teal" />
        <h2 className="text-xl font-black text-ink">{title}</h2>
      </div>
      <div className="mt-4 grid gap-2">
        {items.map(item => (
          <p key={item} className="rounded border border-line bg-paper px-3 py-2 text-sm font-semibold text-muted">{item}</p>
        ))}
      </div>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded border border-line bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-ink">{value}</strong>
    </article>
  );
}

function RevenueCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-teal" />
        <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
      </div>
      <strong className="mt-3 block text-3xl font-black text-teal">${value.toLocaleString()}</strong>
    </article>
  );
}
