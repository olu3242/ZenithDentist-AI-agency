import { PortalUsageTracker } from "@/components/portal/portal-usage-tracker";
import { RealtimeRefresh } from "@/components/portal/realtime-refresh";
import { AppShell } from "@/components/app/app-shell";
import { getPortalData, summarizePortal } from "@/lib/data/operations";
import { TenantProvider } from "@/components/tenant/tenant-provider";
import { getTenantData } from "@/lib/data/tenants";
import { getCurrentZenithRole } from "@/lib/server-auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const data = await getPortalData();
  const tenantData = await getTenantData();
  const summary = summarizePortal(data);
  const role = await getCurrentZenithRole("practice_owner");

  return (
    <TenantProvider tenant={tenantData.tenant}>
      <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations} unread={summary.unreadNotifications}>
          <RealtimeRefresh />
          <PortalUsageTracker />
          {children}
      </AppShell>
    </TenantProvider>
  );
}
