import { ExecutiveReport } from "@/components/portal/executive-report";
import { DashboardContainer } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { buildExecutiveReport, getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";

export default async function PortalReportsPage() {
  const tenantData = await getTenantData();
  const data = await getPortalData(tenantData.tenant.organizationId);
  const reports = data.reports.length ? data.reports : [buildExecutiveReport(data)];
  return (
    <DashboardContainer>
      <PortalHeader title="Executive Reports" subtitle="Weekly and monthly operational intelligence briefings with branded downloadable summaries." />
      {reports.map(report => <ExecutiveReport key={report.id} report={report} />)}
    </DashboardContainer>
  );
}
