import { BookOpen, CalendarClock, ClipboardList, HelpCircle, TrendingUp } from "lucide-react";
import { DashboardContainer, DashboardGrid, KpiGrid } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { getTenantData } from "@/lib/data/tenants";
import {
  getEducationPipeline,
  getAcceptanceRisk,
  getRevenueInfluence,
  listTreatmentOverviewsForOrganization
} from "@/lib/treatment-visualization";

export default async function TreatmentVisualizationPage() {
  const tenantData = await getTenantData();
  const organizationId = tenantData.tenant.organizationId ?? tenantData.organization.id;

  const [pipeline, risk, revenue, overviews] = await Promise.all([
    getEducationPipeline(organizationId),
    getAcceptanceRisk(organizationId),
    getRevenueInfluence(organizationId),
    listTreatmentOverviewsForOrganization(organizationId)
  ]);

  return (
    <DashboardContainer>
      <PortalHeader
        title="Treatment Visualization"
        subtitle="Patient-facing treatment education — overview, expected outcome, recovery timeline, and FAQ for unscheduled high-value treatment plans."
      />

      <KpiGrid>
        <Kpi label="Education Sent" value={pipeline.educationSent} />
        <Kpi label="Viewed" value={pipeline.viewed} />
        <Kpi label="Accepted" value={pipeline.accepted} />
        <Kpi label="Revenue at Risk" value={`$${risk.revenueAtRisk.toFixed(2)}`} />
      </KpiGrid>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal" />
            <p className="text-xs font-black uppercase tracking-wider text-muted">Revenue Influence</p>
          </div>
          <strong className="mt-3 block text-3xl font-black text-teal">${revenue.revenueGenerated.toLocaleString()}</strong>
          <p className="mt-1 text-sm font-semibold text-muted">{revenue.treatmentsAccepted} treatments accepted</p>
        </article>
        <article className="rounded border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-teal" />
            <p className="text-xs font-black uppercase tracking-wider text-muted">Acceptance Risk</p>
          </div>
          <strong className="mt-3 block text-3xl font-black text-ink">{risk.atRiskCount}</strong>
          <p className="mt-1 text-sm font-semibold text-muted">low-engagement plans at risk of non-acceptance</p>
        </article>
      </section>

      <DashboardGrid>
        {overviews.length === 0 ? (
          <section className="rounded border border-line bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-ink">Treatment Education</h2>
            <p className="mt-2 text-sm font-semibold text-muted">No treatment education has been generated yet.</p>
          </section>
        ) : (
          overviews.map(overview => (
            <section key={overview.id} className="rounded border border-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-black text-ink">{overview.treatmentCode ?? "Treatment"}</h2>
                <span className="rounded bg-paper px-3 py-1 text-xs font-black uppercase text-teal">{overview.status}</span>
              </div>

              {overview.overview ? (
                <div className="mt-4 flex items-start gap-3">
                  <BookOpen className="mt-1 h-4 w-4 shrink-0 text-teal" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-muted">Treatment Overview</p>
                    <p className="mt-1 text-sm font-semibold text-muted">{overview.overview}</p>
                  </div>
                </div>
              ) : null}

              {overview.expectedOutcome ? (
                <div className="mt-4 flex items-start gap-3">
                  <TrendingUp className="mt-1 h-4 w-4 shrink-0 text-teal" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-muted">Expected Outcome</p>
                    <p className="mt-1 text-sm font-semibold text-muted">{overview.expectedOutcome}</p>
                  </div>
                </div>
              ) : null}

              {overview.recoveryTimeline.length > 0 ? (
                <div className="mt-4 flex items-start gap-3">
                  <CalendarClock className="mt-1 h-4 w-4 shrink-0 text-teal" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-wider text-muted">Recovery Timeline</p>
                    <div className="mt-2 grid gap-2">
                      {overview.recoveryTimeline.map(step => (
                        <div key={step.day} className="rounded border border-line bg-paper px-3 py-2 text-sm font-semibold text-muted">
                          <span className="font-black text-ink">{step.day}:</span> {step.milestone}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {overview.faq.length > 0 ? (
                <div className="mt-4 flex items-start gap-3">
                  <HelpCircle className="mt-1 h-4 w-4 shrink-0 text-teal" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-wider text-muted">FAQ</p>
                    <div className="mt-2 grid gap-2">
                      {overview.faq.map(item => (
                        <div key={item.question} className="rounded border border-line bg-paper px-3 py-2 text-sm font-semibold text-muted">
                          <p className="font-black text-ink">{item.question}</p>
                          <p className="mt-1">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          ))
        )}
      </DashboardGrid>
    </DashboardContainer>
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
