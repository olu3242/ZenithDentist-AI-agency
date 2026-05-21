import { CRMTable } from "@/components/admin/crm-table";
import { Header } from "@/app/admin/page";
import { getAdminDashboardData } from "@/lib/data/leads";
import { formatCurrency } from "@/lib/utils";

export default async function AdminRoiPage() {
  const { roiCalculations } = await getAdminDashboardData();
  return (
    <div className="space-y-6">
      <Header title="ROI Intelligence" subtitle="Persisted revenue projections from the public audit funnel." />
      <CRMTable
        columns={["Lead", "Chairs", "Monthly appts", "No-show", "Monthly loss", "Recoverable"]}
        rows={roiCalculations.map(roi => [
          roi.lead_id,
          roi.chairs,
          roi.monthly_appointments,
          `${roi.no_show_rate}%`,
          formatCurrency(Number(roi.monthly_revenue_loss)),
          <strong key="recoverable" className="text-green">{formatCurrency(Number(roi.recoverable_revenue))}</strong>
        ])}
      />
    </div>
  );
}
