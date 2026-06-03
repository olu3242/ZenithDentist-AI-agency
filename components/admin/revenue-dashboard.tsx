import { MetricCard } from "@/components/metric-card";
import { formatCurrency } from "@/lib/utils";
import type { Audit, Booking, Lead, Opportunity, OutreachEvent, RoiCalculation } from "@/lib/data/leads";

export function RevenueDashboard({
  leads,
  roiCalculations,
  audits,
  bookings,
  events,
  opportunities = []
}: {
  leads: Lead[];
  roiCalculations: RoiCalculation[];
  audits: Audit[];
  bookings: Booking[];
  events: OutreachEvent[];
  opportunities?: Opportunity[];
}) {
  const visitors = events.filter(e => e.event_type === "cta_clicked").length;
  const assessmentsStarted = events.filter(e => e.event_type === "assessment_started").length || leads.filter(l => l.source === "free_revenue_opportunity_assessment").length;
  const assessmentsCompleted = audits.length;
  const auditsGenerated = audits.length;
  const bookingCount = bookings.filter(b => b.booking_status === "scheduled").length;
  const showRate = bookingCount > 0 ? Math.round((bookings.filter(b => b.booking_status === "completed").length / bookingCount) * 100) : null;

  // Prefer opportunities table for pipeline value when available; fall back to roi_calculations
  const opportunityPipelineValue = opportunities.reduce((sum, o) => sum + Number(o.pipeline_value ?? 0), 0);
  const roiPipelineValue = roiCalculations.reduce((sum, r) => sum + Number(r.revenue_recovery_opportunity ?? 0) * 12, 0);
  const pipelineValue = opportunityPipelineValue > 0 ? opportunityPipelineValue : roiPipelineValue;

  const estimatedRecovery = roiCalculations.reduce((sum, r) => sum + Number(r.revenue_recovery_opportunity ?? 0), 0);

  const activeOpportunities = opportunities.filter(o => !["won", "lost"].includes(o.stage)).length;
  const bookedOpportunities = opportunities.filter(o => o.stage === "booking_created").length;

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
        label="Active Opportunities"
        value={activeOpportunities}
        detail={`${bookedOpportunities} at booking stage`}
        tone="teal"
      />
      <MetricCard
        label="Pipeline Value"
        value={formatCurrency(pipelineValue)}
        detail="Annual recovery across all opportunities"
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
