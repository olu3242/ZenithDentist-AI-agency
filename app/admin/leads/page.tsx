import { CRMTable } from "@/components/admin/crm-table";
import { LeadStatusBadge } from "@/components/admin/lead-status-badge";
import { Header } from "@/app/admin/page";
import { getAdminDashboardData } from "@/lib/data/leads";

export default async function AdminLeadsPage() {
  const { leads } = await getAdminDashboardData();
  return (
    <div className="space-y-6">
      <Header title="Leads" subtitle="Lead intelligence, source attribution, and sales follow-up state." />
      <CRMTable
        columns={["Practice", "Dentist", "Email", "Pain", "Status", "Source"]}
        rows={leads.map(lead => [
          <strong key="practice">{lead.practice_name}</strong>,
          lead.dentist_name ?? "Unknown",
          lead.email,
          <span key="pain" className="line-clamp-2 max-w-sm">{lead.operational_pain}</span>,
          <LeadStatusBadge key="status" status={lead.status} />,
          lead.source
        ])}
      />
    </div>
  );
}
