import { AdminCharts } from "@/components/admin/admin-charts";
import { AdminHeader } from "@/components/admin/admin-header";
import { getAdminDashboardData } from "@/lib/data/leads";

export default async function AdminAnalyticsPage() {
  const data = await getAdminDashboardData();
  return (
    <div className="space-y-6">
      <AdminHeader title="Analytics" subtitle="Lead growth, conversion rate, funnel completion, audit demand, booking trends, and source activity." />
      <AdminCharts leads={data.leads} roiCalculations={data.roiCalculations} events={data.events} />
    </div>
  );
}
