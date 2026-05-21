import "server-only";

import { automationRegistry } from "@/lib/automation/registry";
import { getAdminDashboardData } from "@/lib/data/leads";

export const outreachStages = ["Queued", "Sent", "Follow-up 1", "Follow-up 2", "Replied", "Discovery", "Proposal", "Booked", "Closed", "Dead"] as const;
export type OutreachStage = typeof outreachStages[number];

export async function getLeadOperationsState() {
  const data = await getAdminDashboardData();
  const leads = data.leads;
  const events = data.events;
  const bookings = data.bookings;
  const replied = events.filter(event => String(event.event_metadata).toLowerCase().includes("reply")).length;
  const booked = bookings.filter(booking => booking.booking_status === "scheduled" || booking.booking_status === "clicked").length;
  const sent = events.filter(event => event.event_type === "email_sent" || event.event_type === "cta_clicked").length;
  const discovery = events.filter(event => String(event.event_metadata).includes("discovery")).length;
  const proposal = events.filter(event => String(event.event_metadata).includes("proposal")).length;
  const closed = leads.filter(lead => lead.status === "won").length;
  const dead = leads.filter(lead => lead.status === "lost").length;
  const queued = Math.max(0, leads.length - sent);
  const workflow = automationRegistry.find(item => item.id === "lead_created");

  const stageCounts: Record<OutreachStage, number> = {
    Queued: queued,
    Sent: sent,
    "Follow-up 1": events.filter(event => String(event.event_metadata).includes("follow_up_1")).length,
    "Follow-up 2": events.filter(event => String(event.event_metadata).includes("follow_up_2")).length,
    Replied: replied,
    Discovery: discovery,
    Proposal: proposal,
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
      campaignHealth: leads.length ? Math.max(0, Math.min(100, Math.round((booked / Math.max(1, leads.length)) * 100 + (sent ? replied / sent * 40 : 0)))) : 0,
      prioritizationScore: leads.length ? Math.round(((booked + replied + discovery + proposal) / Math.max(1, leads.length)) * 100) : 0
    },
    workflow,
    prioritizedLeads: leads.slice(0, 12).map((lead, index) => ({
      id: lead.id,
      practiceName: lead.practice_name,
      status: lead.status,
      score: calculateLeadPriority({
        noShowRate: lead.no_show_rate,
        locations: lead.locations,
        staffSize: lead.staff_size,
        status: lead.status,
        rank: index
      }),
      suggestion: lead.no_show_rate && lead.no_show_rate > 10
        ? "Lead with no-show recovery angle and quantified revenue leakage."
        : "Personalize around recall gaps, front-office capacity, and revenue recovery."
    })),
    cadenceRecommendations: workflow?.actions ?? []
  };
}

function calculateLeadPriority(input: { noShowRate: number | null; locations: number; staffSize: number | null; status: string; rank: number }) {
  const noShowWeight = Math.min(35, Number(input.noShowRate ?? 0) * 1.4);
  const locationWeight = Math.min(25, input.locations * 8);
  const staffingWeight = Math.min(25, Number(input.staffSize ?? 0) * 2);
  const statusWeight = input.status === "booked" ? 15 : input.status === "contacted" ? 8 : 0;
  const recencyWeight = Math.max(0, 10 - input.rank);
  return Math.round(Math.min(100, noShowWeight + locationWeight + staffingWeight + statusWeight + recencyWeight));
}
