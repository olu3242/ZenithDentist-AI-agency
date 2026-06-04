import { LocationDashboard } from "@/components/tenant/location-dashboard";
import { MultiLocationGrid } from "@/components/tenant/multi-location-grid";
import { OperationalTrendChart } from "@/components/tenant/operational-trend-chart";
import { DashboardContainer, DashboardGrid } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";

export default async function PortalLocationsPage() {
  const tenantData = await getTenantData();
  const data = await getPortalData(tenantData.tenant.organizationId);

  return (
    <DashboardContainer>
      <PortalHeader title="Multi-Location Analytics" subtitle="Location comparisons across revenue recovery, no-show rate, patient engagement, and review generation." />
      <MultiLocationGrid locations={tenantData.locations} />
      <LocationDashboard locations={tenantData.locations} metrics={data.metrics} />
      <DashboardGrid>
        <OperationalTrendChart metrics={data.metrics} field="recovered_revenue" label="Revenue Recovery by Period" />
        <OperationalTrendChart metrics={data.metrics} field="patient_engagement_rate" label="Patient Engagement Trend" />
      </DashboardGrid>
    </DashboardContainer>
  );
}
