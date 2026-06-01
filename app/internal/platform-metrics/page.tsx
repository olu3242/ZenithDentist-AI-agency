import { InternalHeader } from "@/components/internal/internal-header";
import { OperationalTrendChart } from "@/components/tenant/operational-trend-chart";
import { MetricCard } from "@/components/metric-card";
import { getInternalPlatformData } from "@/lib/data/internal";

export default async function InternalPlatformMetricsPage() {
  const { portalData, platformHealth, activeOrganizations } = await getInternalPlatformData();
  return (
    <div className="space-y-6">
      <InternalHeader title="Platform Metrics" subtitle="Platform health, organization growth, retention analytics, and operational trend forecasting." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Platform health" value={platformHealth} detail="Composite internal score" tone="accent" />
        <MetricCard label="Active orgs" value={activeOrganizations} detail="Tenant-ready architecture" tone="primary" />
        <MetricCard label="Automation events" value={portalData.automationEvents.length} detail="Event-driven operating layer" tone="warning" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <OperationalTrendChart metrics={portalData.metrics} field="recovered_revenue" label="Platform Recovery Trend" />
        <OperationalTrendChart metrics={portalData.metrics} field="confirmation_rate" label="Confirmation Rate Trend" />
      </div>
    </div>
  );
}
