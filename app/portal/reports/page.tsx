import { ExecutiveReport } from "@/components/portal/executive-report";
import { DashboardContainer } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { buildExecutiveReport, getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { getTreatmentVisualizationReport } from "@/lib/treatment-visualization";

export default async function PortalReportsPage() {
  const [data, tenantData] = await Promise.all([getPortalData(), getTenantData()]);
  const reports = data.reports.length ? data.reports : [buildExecutiveReport(data)];
  const organizationId = tenantData.tenant.organizationId ?? tenantData.organization.id;
  const treatmentVisualizationReport = await getTreatmentVisualizationReport(organizationId);

  return (
    <DashboardContainer>
      <PortalHeader title="Executive Reports" subtitle="Weekly and monthly operational intelligence briefings with branded downloadable summaries." />
      {reports.map(report => <ExecutiveReport key={report.id} report={report} />)}

      <section className="rounded border border-line bg-white p-6 shadow-soft">
        <p className="text-xs font-black uppercase tracking-wider text-teal">treatment visualization report</p>
        <h2 className="mt-2 text-3xl font-black">Treatment Visualization Journey</h2>
        <p className="mt-3 max-w-3xl text-muted">
          Education engagement, acceptance lift, and revenue influence for TVA-delivered treatment education.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded bg-paper p-4">
            <span className="text-xs font-black uppercase tracking-wider text-muted">Education Engagement</span>
            <strong className="mt-2 block text-2xl font-black text-ink">
              {treatmentVisualizationReport.educationEngagement.viewRate}%
            </strong>
            <p className="mt-1 text-sm font-semibold text-muted">
              {treatmentVisualizationReport.educationEngagement.viewed} viewed of {treatmentVisualizationReport.educationEngagement.sent} sent
            </p>
          </div>
          <div className="rounded bg-paper p-4">
            <span className="text-xs font-black uppercase tracking-wider text-muted">Acceptance Lift</span>
            <strong className="mt-2 block text-2xl font-black text-ink">
              {treatmentVisualizationReport.acceptanceLift.acceptanceRate}%
            </strong>
            <p className="mt-1 text-sm font-semibold text-muted">
              {treatmentVisualizationReport.acceptanceLift.accepted} accepted of {treatmentVisualizationReport.acceptanceLift.delivered} delivered
            </p>
          </div>
          <div className="rounded bg-paper p-4">
            <span className="text-xs font-black uppercase tracking-wider text-muted">Revenue Influence</span>
            <strong className="mt-2 block text-2xl font-black text-ink">
              ${treatmentVisualizationReport.revenueInfluence.revenueGenerated.toFixed(2)}
            </strong>
            <p className="mt-1 text-sm font-semibold text-muted">
              {treatmentVisualizationReport.revenueInfluence.treatmentsAccepted} treatments accepted
            </p>
          </div>
        </div>
      </section>
    </DashboardContainer>
  );
}
