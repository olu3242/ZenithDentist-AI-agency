import { OnboardingProgress } from "@/components/tenant/onboarding-progress";
import { OrganizationSettings } from "@/components/tenant/organization-settings";
import { DashboardContainer } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { getTenantData } from "@/lib/data/tenants";

export default async function PortalOnboardingPage() {
  const tenantData = await getTenantData();
  return (
    <DashboardContainer>
      <PortalHeader title="Practice Onboarding" subtitle="Baseline setup, PMS readiness, workflow configuration, reminder cadence, and recall preferences." />
      <OnboardingProgress organization={tenantData.organization} />
      <OrganizationSettings organization={tenantData.organization} />
    </DashboardContainer>
  );
}
