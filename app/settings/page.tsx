import { AppShell } from "@/components/app/app-shell";
import { OrganizationSettings } from "@/components/tenant/organization-settings";
import { PlanComparison } from "@/components/tenant/plan-comparison";
import { UsageMeter } from "@/components/tenant/usage-meter";
import { getTenantData } from "@/lib/data/tenants";
import { getCurrentZenithRole } from "@/lib/server-auth";

export default async function SettingsPage() {
  const [tenantData, role] = await Promise.all([
    getTenantData(),
    getCurrentZenithRole("practice_owner")
  ]);
  const activePlan = tenantData.plans.find(plan => plan.plan_key === tenantData.organization.active_plan);

  return (
    <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}>
      <div className="space-y-6">
        <header>
          <p className="text-xs font-black uppercase tracking-wider text-teal">Global settings</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Settings</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">
            Organization profile, usage, plan visibility, and role-aware portal preferences.
          </p>
        </header>
        <OrganizationSettings organization={tenantData.organization} />
        <UsageMeter usage={tenantData.usage[0]} plan={activePlan} />
        <PlanComparison plans={tenantData.plans} activePlan={tenantData.organization.active_plan} />
      </div>
    </AppShell>
  );
}
