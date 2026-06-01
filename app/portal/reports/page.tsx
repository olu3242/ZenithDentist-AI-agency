import { ExecutiveReport } from "@/components/portal/executive-report";
import { PortalHeader } from "@/components/portal/portal-header";
import { buildExecutiveReport, getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";

export default async function PortalReportsPage() {
  const tenantData = await getTenantData();
  const data = await getPortalData(tenantData.tenant.organizationId ?? undefined);
  const reports = data.reports.length ? data.reports : [buildExecutiveReport(data)];
  return (
    <div className="space-y-6">
      <PortalHeader title="Executive Reports" subtitle="Weekly and monthly operational intelligence briefings with branded downloadable summaries." />
      {reports.map(report => <ExecutiveReport key={report.id} report={report} />)}
    </div>
  );
}
