import { LocationDashboard } from "@/components/tenant/location-dashboard";
import { MultiLocationGrid } from "@/components/tenant/multi-location-grid";
import { OperationalTrendChart } from "@/components/tenant/operational-trend-chart";
import { PortalHeader } from "@/components/portal/portal-header";
import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";

export default async function PortalLocationsPage() {
  const tenantData = await getTenantData();
  const data = await getPortalData(tenantData.tenant.organizationId ?? undefined);

  return (
    <div className="space-y-6">
      <PortalHeader title="Multi-Location Analytics" subtitle="Location comparisons across revenue recovery, no-show rate, patient engagement, and review generation." />
      <MultiLocationGrid locations={tenantData.locations} />
      <LocationDashboard locations={tenantData.locations} metrics={data.metrics} />
      <div className="grid gap-6 xl:grid-cols-2">
        <OperationalTrendChart metrics={data.metrics} field="recovered_revenue" label="Revenue Recovery by Period" />
        <OperationalTrendChart metrics={data.metrics} field="patient_engagement_rate" label="Patient Engagement Trend" />
      </div>
    </div>
  );
}
