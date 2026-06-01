import { PortalHeader } from "@/components/portal/portal-header";
import { OrganizationSettings } from "@/components/tenant/organization-settings";
import { PlanComparison } from "@/components/tenant/plan-comparison";
import { UsageMeter } from "@/components/tenant/usage-meter";
import { getTenantData } from "@/lib/data/tenants";

const settings = [
  ["Reminder timing", "48 hours, 24 hours, 2 hours before appointment"],
  ["Review timing", "2 hours after completed appointment"],
  ["Recall intervals", "90, 180, and 365 day segments"],
  ["Notification preferences", "Critical failures immediately, performance digest weekly"],
  ["Reporting cadence", "Weekly executive summary, monthly board-style report"]
];

export default async function PortalSettingsPage() {
  const tenantData = await getTenantData();
  const activePlan = tenantData.plans.find(plan => plan.plan_key === tenantData.organization.active_plan);
  return (
    <div className="space-y-6">
      <PortalHeader title="Client Settings" subtitle="Practice-level automation preferences prepared for authenticated role-based editing." />
      <OrganizationSettings organization={tenantData.organization} />
      <UsageMeter usage={tenantData.usage[0]} plan={activePlan} />
      <PlanComparison plans={tenantData.plans} activePlan={tenantData.organization.active_plan} />
      <section className="grid gap-4">
        {settings.map(([label, value]) => (
          <article key={label} className="rounded border border-card bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-muted">{label}</p>
            <strong className="mt-2 block text-lg">{value}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
