import { CRMTable } from "@/components/admin/crm-table";
import { MetricCard } from "@/components/metric-card";
import { InternalHeader } from "@/components/internal/internal-header";
import { SubscriptionBadge } from "@/components/tenant/subscription-badge";
import { getInternalPlatformData } from "@/lib/data/internal";

export default async function InternalOrganizationsPage() {
  const { tenantData, activeOrganizations, orgGrowth } = await getInternalPlatformData();
  return (
    <div className="space-y-6">
      <InternalHeader title="Organizations" subtitle="Tenant inventory, organization growth, plans, onboarding state, and isolation readiness." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Active organizations" value={activeOrganizations} detail={`${orgGrowth}% month-over-month growth`} tone="teal" />
        <MetricCard label="Locations" value={tenantData.locations.length} detail="Across active tenants" tone="gold" />
        <MetricCard label="Onboarding status" value={tenantData.organization.onboarding_status.replace("_", " ")} detail="Current demo tenant" tone="blue" />
      </div>
      <CRMTable
        columns={["Organization", "Type", "Plan", "Locations", "Status"]}
        rows={[[tenantData.organization.name, tenantData.organization.organization_type, <SubscriptionBadge key="plan" plan={tenantData.organization.active_plan} />, tenantData.locations.length, tenantData.organization.onboarding_status]]}
      />
    </div>
  );
}
