import { AppShell } from "@/components/app/app-shell";
import { RuntimeHealthDashboard } from "@/components/mission-control/runtime-health-dashboard";
import { MetricCard } from "@/components/metric-card";
import { getAutomationOSState } from "@/lib/automation-os/registry";
import { getAdminDashboardData } from "@/lib/data/leads";
import { getTenantData } from "@/lib/data/tenants";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getCurrentZenithRole } from "@/lib/server-auth";

export default async function DashboardPage() {
  const [admin, runtime, automationOS, tenantData, role] = await Promise.all([
    getAdminDashboardData(),
    getRuntimeHealthState(),
    getAutomationOSState(),
    getTenantData(),
    getCurrentZenithRole("staff")
  ]);
  const pipelineValue = admin.roiCalculations.reduce((sum, item) => sum + Number(item.recoverable_revenue), 0);
  const booked = admin.bookings.filter(booking => booking.booking_status === "scheduled" || booking.booking_status === "clicked").length;

  return (
    <AppShell role={role} organization={tenantData.organization} locations={tenantData.locations}>
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <p className="text-xs font-black uppercase tracking-wider text-teal">Zenith AI Automation Agency</p>
          <h1 className="mt-2 text-4xl font-black text-ink">Executive Dashboard</h1>
          <p className="mt-2 max-w-3xl text-base font-semibold text-muted">Agency visibility, operational KPIs, automation ROI, client health, pipeline value, revenue visibility, and SLA summary.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Pipeline value" value={`$${Math.round(pipelineValue).toLocaleString()}`} detail="Recoverable revenue modeled" tone="green" />
          <MetricCard label="Leads" value={admin.leads.length} detail="Current prospect records" tone="teal" />
          <MetricCard label="Booked calls" value={booked} detail="Booking flow activity" tone="blue" />
          <MetricCard label="Automations" value={automationOS.counts.active} detail={`${automationOS.counts.totalExecutions} live executions`} tone="blue" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Organizations" value={tenantData.organization.id.startsWith("org-") ? 0 : 1} detail={tenantData.organization.name} tone="teal" />
          <MetricCard label="Locations" value={tenantData.locations.length} detail="Scoped by organization" tone="green" />
          <MetricCard label="SLA breaches" value={runtime.slaBreaches.length} detail="Live runtime window" tone="rust" />
        </div>
        <RuntimeHealthDashboard state={runtime} />
      </div>
    </AppShell>
  );
}
