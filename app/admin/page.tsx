import { AdminCharts } from "@/components/admin/admin-charts";
import { LeadPipeline } from "@/components/admin/lead-pipeline";
import { RevenueDashboard } from "@/components/admin/revenue-dashboard";
import { CRMTable } from "@/components/admin/crm-table";
import { LeadStatusBadge } from "@/components/admin/lead-status-badge";
import { AdminShellNote } from "@/components/admin/admin-shell-note";
import { AdminHeader } from "@/components/admin/admin-header";
import { getAdminDashboardData } from "@/lib/data/leads";

export default async function AdminPage() {
  const data = await getAdminDashboardData();
  return (
    <div className="space-y-6">
      <AdminHeader title="Revenue Command Center" subtitle="Operational CRM, funnel analytics, and revenue intelligence in one view." />
      <AdminShellNote />
      <RevenueDashboard {...data} />
      <LeadPipeline leads={data.leads} bookings={data.bookings} />
      <AdminCharts leads={data.leads} roiCalculations={data.roiCalculations} events={data.events} />
      <CRMTable
        columns={["Practice", "Contact", "Status", "Source", "Created"]}
        rows={data.leads.slice(0, 8).map(lead => [
          <strong key="practice">{lead.practice_name}</strong>,
          <span key="contact">{lead.email}</span>,
          <LeadStatusBadge key="status" status={lead.status} />,
          lead.source,
          new Date(lead.created_at).toLocaleDateString()
        ])}
      />
    </div>
  );
}
