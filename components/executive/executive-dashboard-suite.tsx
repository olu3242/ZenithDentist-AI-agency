import { AliceExecutiveBriefing } from "@/components/executive/alice-executive-briefing";
import { ForecastWidget } from "@/components/executive/forecast-widget";
import { PatientIntelligenceWidget } from "@/components/executive/patient-intelligence-widget";
import { ProviderLeaderboard } from "@/components/executive/provider-leaderboard";
import { RevenueRecoveryWidget } from "@/components/executive/revenue-recovery-widget";
import { WorkflowHealthWidget } from "@/components/executive/workflow-health-widget";
import { DashboardPersonalization } from "@/components/widgets";

export function ExecutiveDashboardSuite({ recoveredRevenue, recoverableRevenue }: { recoveredRevenue?: number; recoverableRevenue?: number }) {
  return (
    <div className="space-y-6">
      <DashboardPersonalization widgets={[
        { id: "revenue", title: "Revenue", body: "Recoverable revenue, revenue trends, and leakage by category." },
        { id: "patients", title: "Patients", body: "Patient segments, recall funnel, and treatment acceptance funnel." },
        { id: "providers", title: "Providers", body: "Provider rankings, capacity, and growth coaching priorities." },
        { id: "forecasts", title: "Forecasts", body: "Revenue, collections, growth, and risk forecasts." }
      ]} />
      <RevenueRecoveryWidget recoveredRevenue={recoveredRevenue} recoverableRevenue={recoverableRevenue} />
      <PatientIntelligenceWidget />
      <div className="grid gap-6 xl:grid-cols-2">
        <ProviderLeaderboard />
        <ForecastWidget />
      </div>
      <WorkflowHealthWidget />
      <AliceExecutiveBriefing />
    </div>
  );
}
