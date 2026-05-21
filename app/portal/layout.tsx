import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalUsageTracker } from "@/components/portal/portal-usage-tracker";
import { RealtimeRefresh } from "@/components/portal/realtime-refresh";
import { getPortalData, summarizePortal } from "@/lib/data/operations";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const data = await getPortalData();
  const summary = summarizePortal(data);

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[270px_1fr]">
      <PortalSidebar unread={summary.unreadNotifications} />
      <main className="p-5 lg:p-8">
        <RealtimeRefresh />
        <PortalUsageTracker />
        {children}
      </main>
    </div>
  );
}
