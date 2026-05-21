import { ExecutiveReport } from "@/components/portal/executive-report";
import { PortalHeader } from "@/components/portal/portal-header";
import { RevenueTrendChart } from "@/components/portal/revenue-trend-chart";
import { OperationalScorecard } from "@/components/portal/operational-scorecard";
import { buildExecutiveReport, getPortalData } from "@/lib/data/operations";

export default async function PortalRevenuePage() {
  const data = await getPortalData();
  const report = data.reports[0] ?? buildExecutiveReport(data);
  return (
    <div className="space-y-6">
      <PortalHeader title="Revenue Intelligence" subtitle="Recovered revenue, leakage reduction, and financial impact from operational automations." />
      <OperationalScorecard data={data} />
      <RevenueTrendChart metrics={data.metrics} />
      <ExecutiveReport report={report} />
    </div>
  );
}
