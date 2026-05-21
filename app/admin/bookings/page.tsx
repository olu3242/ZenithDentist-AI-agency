import { CRMTable } from "@/components/admin/crm-table";
import { Header } from "@/app/admin/page";
import { getAdminDashboardData } from "@/lib/data/leads";

export default async function AdminBookingsPage() {
  const { bookings } = await getAdminDashboardData();
  return (
    <div className="space-y-6">
      <Header title="Bookings" subtitle="Calendly handoffs, booking statuses, and operational notes." />
      <CRMTable
        columns={["Lead", "Calendly event", "Status", "Scheduled", "Notes"]}
        rows={bookings.map(booking => [
          booking.lead_id ?? "Unattributed",
          booking.calendly_event_id ?? "Pending",
          booking.booking_status,
          booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString() : "Not scheduled",
          booking.notes ?? ""
        ])}
      />
    </div>
  );
}
