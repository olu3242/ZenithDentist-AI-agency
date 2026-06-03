import { MetricCard } from "@/components/metric-card";
import { formatCurrency } from "@/lib/utils";
import type { Audit, Booking, Lead, OutreachEvent, RoiCalculation } from "@/lib/data/leads";

export function RevenueDashboard({
  leads,
  roiCalculations,
  audits,
  bookings,
  events
}: {
  leads: Lead[];
  roiCalculations: RoiCalculation[];
  audits: Audit[];
  bookings: Booking[];
  events: OutreachEvent[];
}) {
  // Visitors: unique session proxied by distinct cta_clicked events (best available without page analytics)
  const visitors = events.filter(e => e.event_type === "cta_clicked").length;

  // Assessments started: roi_completed or assessment events, approximated by leads with source=free_revenue
  const assessmentsStarted = leads.filter(l => l.source === "free_revenue_opportunity_assessment").length;

  // Assessments completed: leads that have an associated audit
  const assessmentsCompleted = audits.length;

  // Audits generated = same as audits
  const auditsGenerated = audits.length;

  // Bookings
  const bookingCount = bookings.filter(b => b.booking_status === "scheduled").length;

  // Show rate: completed / booked (approximation — bookings don't track completion yet)
  const showRate = bookingCount > 0 ? Math.round((bookings.filter(b => b.booking_status === "completed").length / bookingCount) * 100) : null;

  // Pipeline value: sum of revenue_recovery_opportunity × 12 (annual) across all ROI records
  const pipelineValue = roiCalculations.reduce((sum, r) => sum + Number(r.revenue_recovery_opportunity ?? 0) * 12, 0);

  // Estimated recoverable revenue: monthly sum
  const estimatedRecovery = roiCalculations.reduce((sum, r) => sum + Number(r.revenue_recovery_opportunity ?? 0), 0);

  const auditConversionRate = assessmentsStarted > 0 ? Math.round((assessmentsCompleted / assessmentsStarted) * 100) : 0;
  const bookingConversionRate = assessmentsCompleted > 0 ? Math.round((bookingCount / assessmentsCompleted) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Visitors"
        value={visitors || "—"}
        detail="CTA interactions tracked"
        tone="blue"
      />
      <MetricCard
        label="Assessments Started"
        value={assessmentsStarted}
        detail="Revenue assessment submissions"
        tone="teal"
      />
      <MetricCard
        label="Assessments Completed"
        value={assessmentsCompleted}
        detail={`${auditConversionRate}% lead→audit conversion`}
        tone="teal"
      />
      <MetricCard
        label="Audits Generated"
        value={auditsGenerated}
        detail="Revenue opportunity reports"
        tone="gold"
      />
      <MetricCard
        label="Bookings"
        value={bookingCount}
        detail={`${bookingConversionRate}% audit→booking rate`}
        tone="green"
      />
      <MetricCard
        label="Show Rate"
        value={showRate !== null ? `${showRate}%` : "—"}
        detail="Completed strategy sessions"
        tone="blue"
      />
      <MetricCard
        label="Pipeline Value"
        value={formatCurrency(pipelineValue)}
        detail="Annual recovery × all opportunities"
        tone="gold"
      />
      <MetricCard
        label="Est. Recoverable Revenue"
        value={formatCurrency(estimatedRecovery)}
        detail="Monthly across all assessments"
        tone="green"
      />
    </div>
  );
}
