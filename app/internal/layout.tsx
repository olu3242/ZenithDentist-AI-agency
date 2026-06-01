import { AppShell } from "@/components/app/app-shell";
import { getTenantData } from "@/lib/data/tenants";
import { getCurrentZenithRole } from "@/lib/server-auth";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const [tenantData, role] = await Promise.all([
    getTenantData(),
    getCurrentZenithRole("super_admin")
  ]);

  return (
    <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}>
      {children}
    </AppShell>
  );
}
