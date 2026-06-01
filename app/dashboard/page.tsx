import { RuntimeHealthDashboard } from "@/components/mission-control/runtime-health-dashboard";
import { MetricCard } from "@/components/metric-card";
import { getAdminDashboardData } from "@/lib/data/leads";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";

export default async function DashboardPage() {
  const [admin, runtime] = await Promise.all([getAdminDashboardData(), getRuntimeHealthState()]);
  const pipelineValue = admin.roiCalculations.reduce((sum, item) => sum + Number(item.recoverable_revenue), 0);
  const booked = admin.bookings.filter(booking => booking.booking_status === "scheduled" || booking.booking_status === "clicked").length;

  return (
    <main className="min-h-screen bg-background p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs font-black uppercase tracking-wider text-accent">Zenith AI Automation Agency</p>
          <h1 className="mt-2 text-4xl font-black text-[#F8FAFC]">Executive Dashboard</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">Agency visibility, operational KPIs, automation ROI, client health, pipeline value, revenue visibility, and SLA summary.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Pipeline value" value={`$${Math.round(pipelineValue).toLocaleString()}`} detail="Recoverable revenue modeled" tone="success" />
          <MetricCard label="Leads" value={admin.leads.length} detail="Current prospect records" tone="accent" />
          <MetricCard label="Booked calls" value={booked} detail="Booking flow activity" tone="primary" />
          <MetricCard label="SLA breaches" value={runtime.slaBreaches.length} detail="Live runtime window" tone="danger" />
        </div>
        <RuntimeHealthDashboard state={runtime} />
      </div>
    </main>
  );
}
