import { ExecutiveReport } from "@/components/portal/executive-report";
import { DashboardContainer } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { buildExecutiveReport, getPortalData } from "@/lib/data/operations";

export default async function PortalReportsPage() {
  const data = await getPortalData();
  const reports = data.reports.length ? data.reports : [buildExecutiveReport(data)];
  return (
    <DashboardContainer>
      <PortalHeader title="Executive Reports" subtitle="Weekly and monthly operational intelligence briefings with branded downloadable summaries." />
      {reports.map(report => <ExecutiveReport key={report.id} report={report} />)}
    </DashboardContainer>
  );
}
