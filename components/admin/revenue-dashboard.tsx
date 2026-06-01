import { MetricCard } from "@/components/metric-card";
import { formatCurrency } from "@/lib/utils";
import type { Audit, Booking, Lead, RoiCalculation } from "@/lib/data/leads";

export function RevenueDashboard({
  leads,
  roiCalculations,
  audits,
  bookings
}: {
  leads: Lead[];
  roiCalculations: RoiCalculation[];
  audits: Audit[];
  bookings: Booking[];
}) {
  const recovery = roiCalculations.reduce((sum, item) => sum + Number(item.recoverable_revenue), 0);
  const booked = bookings.filter(item => item.booking_status === "scheduled" || item.booking_status === "clicked").length;
  const conversion = leads.length ? Math.round((audits.length / leads.length) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="New leads" value={leads.length} detail="Captured in CRM" tone="accent" />
      <MetricCard label="Projected recovery" value={formatCurrency(recovery)} detail="Across ROI records" tone="success" />
      <MetricCard label="Audit requests" value={audits.length} detail={`${conversion}% lead to audit`} tone="warning" />
      <MetricCard label="Booked calls" value={booked} detail="Calendly handoffs" tone="primary" />
    </div>
  );
}
