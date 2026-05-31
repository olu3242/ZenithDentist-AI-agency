import { CRMTable } from "@/components/admin/crm-table";
import { Header } from "@/app/admin/page";
import { getAdminDashboardData } from "@/lib/data/leads";
import { formatCurrency } from "@/lib/utils";

export default async function AdminAuditsPage() {
  const { audits } = await getAdminDashboardData();
  return (
    <div className="space-y-6">
      <Header title="Audits" subtitle="Generated operational audits and projected recovery opportunities." />
      <CRMTable
        columns={["Summary", "Projected recovery", "Generated"]}
        rows={audits.map(audit => [
          <span key="summary" className="max-w-2xl">{audit.audit_summary}</span>,
          <strong key="recovery" className="text-success">{formatCurrency(Number(audit.projected_recovery))}</strong>,
          new Date(audit.generated_at).toLocaleString()
        ])}
      />
    </div>
  );
}
