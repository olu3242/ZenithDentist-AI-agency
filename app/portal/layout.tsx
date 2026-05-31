import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalUsageTracker } from "@/components/portal/portal-usage-tracker";
import { RealtimeRefresh } from "@/components/portal/realtime-refresh";
import { getPortalData, summarizePortal } from "@/lib/data/operations";
import { TenantProvider } from "@/components/tenant/tenant-provider";
import { getTenantData } from "@/lib/data/tenants";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const tenantData = await getTenantData();
  const data = await getPortalData(tenantData.tenant.organizationId ?? undefined);
  const summary = summarizePortal(data);

  return (
    <TenantProvider tenant={tenantData.tenant}>
      <div className="zenith-layout lg:grid-cols-[var(--sidebar-width)_1fr]">
        <PortalSidebar unread={summary.unreadNotifications} />
        <main className="zenith-main">
          <RealtimeRefresh />
          <PortalUsageTracker />
          {children}
        </main>
      </div>
    </TenantProvider>
  );
}
