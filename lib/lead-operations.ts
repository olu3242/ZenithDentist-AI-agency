import "server-only";

import { automationRegistry } from "@/lib/automation/registry";
import { getAdminDashboardData } from "@/lib/data/leads";

export const outreachStages = ["Queued", "Sent", "Follow-up 1", "Follow-up 2", "Replied", "Booked", "Closed", "Dead"] as const;
export type OutreachStage = typeof outreachStages[number];

export async function getLeadOperationsState() {
  const data = await getAdminDashboardData();
  const leads = data.leads;
  const events = data.events;
  const bookings = data.bookings;
  const replied = events.filter(event => String(event.event_metadata).toLowerCase().includes("reply")).length;
  const booked = bookings.filter(booking => booking.booking_status === "scheduled" || booking.booking_status === "clicked").length;
  const sent = events.filter(event => event.event_type === "email_sent" || event.event_type === "cta_clicked").length;
  const closed = leads.filter(lead => lead.status === "won").length;
  const dead = leads.filter(lead => lead.status === "lost").length;
  const queued = Math.max(0, leads.length - sent);

  const stageCounts: Record<OutreachStage, number> = {
    Queued: queued,
    Sent: sent,
    "Follow-up 1": events.filter(event => String(event.event_metadata).includes("follow_up_1")).length,
    "Follow-up 2": events.filter(event => String(event.event_metadata).includes("follow_up_2")).length,
    Replied: replied,
    Booked: booked,
    Closed: closed,
    Dead: dead
  };

  return {
    leads,
    events,
    bookings,
    stageCounts,
    metrics: {
      prospects: leads.length,
      replyRate: sent ? Math.round((replied / sent) * 100) : 0,
      bookedCalls: booked,
      closeRate: leads.length ? Math.round((closed / leads.length) * 100) : 0,
      campaignHealth: leads.length ? Math.max(0, Math.min(100, Math.round((booked / Math.max(1, leads.length)) * 100 + (sent ? replied / sent * 40 : 0)))) : 0
    },
    workflow: automationRegistry.find(item => item.id === "lead_created")
  };
}
