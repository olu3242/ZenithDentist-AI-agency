import { MetricCard } from "@/components/metric-card";
import { summarizePortal, type PortalData } from "@/lib/data/operations";
import { formatCurrency } from "@/lib/utils";

export function OperationalScorecard({ data }: { data: PortalData }) {
  const summary = summarizePortal(data);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Recovered revenue" value={formatCurrency(summary.recoveredRevenue)} detail={`${formatCurrency(summary.revenueDelta)} vs prior period`} tone="green" />
      <MetricCard label="No-show reduction" value={`${summary.noShowReduction.toFixed(1)} pts`} detail={`${summary.latest.no_show_rate}% current no-show rate`} tone="teal" />
      <MetricCard label="Recall recovery" value={summary.latest.recall_recovery_count} detail="Patients recovered this period" tone="gold" />
      <MetricCard label="Admin time saved" value={`${summary.latest.admin_hours_saved}h`} detail={`${summary.automationSuccessRate}% automation success`} tone="blue" />
    </div>
  );
}
