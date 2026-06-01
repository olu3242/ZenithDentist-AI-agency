import type { Lead, Booking } from "@/lib/data/leads";
import type { LeadStatus } from "@/lib/database.types";
import { LeadStatusBadge } from "@/components/admin/lead-status-badge";

const stages: LeadStatus[] = ["new", "roi_completed", "audit_requested", "booked", "qualified", "won"];

export function LeadPipeline({ leads, bookings }: { leads: Lead[]; bookings: Booking[] }) {
  return (
    <section className="grid gap-3 overflow-x-auto rounded border border-card bg-white p-4 lg:grid-cols-6">
      {stages.map(stage => {
        const stageLeads = leads.filter(lead => {
          if (stage === "booked") return lead.status === "booked" || bookings.some(booking => booking.lead_id === lead.id);
          return lead.status === stage;
        });
        return (
          <div key={stage} className="min-w-52 rounded bg-background p-3">
            <div className="mb-3 flex items-center justify-between">
              <LeadStatusBadge status={stage} />
              <span className="text-sm font-black">{stageLeads.length}</span>
            </div>
            <div className="grid gap-2">
              {stageLeads.slice(0, 5).map(lead => (
                <article key={lead.id} className="rounded border border-card bg-white p-3">
                  <strong className="block text-sm">{lead.practice_name}</strong>
                  <small className="text-muted">{lead.email}</small>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
