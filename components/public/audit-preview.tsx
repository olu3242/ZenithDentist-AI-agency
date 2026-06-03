import { formatCurrency } from "@/lib/utils";
import { BookingFlow } from "@/components/public/booking-flow";
import { Button } from "@/components/ui/button";

export function AuditPreview({
  projectedRecovery,
  calendlyUrl,
  leadId,
  reportId
}: {
  projectedRecovery?: number;
  calendlyUrl: string;
  leadId?: string;
  reportId?: string;
}) {
  const reportReady = Boolean(leadId && reportId);

  return (
    <section id="audit" className="rounded border border-line bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-wider text-teal">FREE Revenue Opportunity Report</p>
      <h3 className="mt-3 text-3xl font-black">Revenue recovery plan</h3>
      <p className="mt-3 text-muted">
        Once the assessment is submitted, Zenith generates a structured report with revenue recovery estimate,
        practice health score, top leaks, recommended playbooks, and a 90-day opportunity snapshot.
      </p>
      <div className="mt-5 rounded bg-paper p-5">
        <span className="text-sm font-bold text-muted">Revenue recovery estimate</span>
        <strong className="mt-2 block text-4xl font-black text-green">
          {projectedRecovery ? formatCurrency(projectedRecovery) : "Pending calculation"}
        </strong>
      </div>
      <ul className="mt-5 grid gap-3 text-sm text-muted">
        <li>$1,500 consulting value delivered free before implementation</li>
        <li>Recall, treatment acceptance, and chair fill opportunity breakdown</li>
        <li>Personalized strategy session preparation with your growth advisor</li>
      </ul>
      <div className="mt-6">
        {reportReady ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <a href={`/api/reports/${reportId}`}>
                Download Report
              </a>
            </Button>
            <BookingFlow calendlyUrl={calendlyUrl} leadId={leadId} />
          </div>
        ) : (
          <p className="rounded border border-line bg-surface p-3 text-sm font-bold text-muted">
            Complete the assessment to unlock your downloadable report and strategy session.
          </p>
        )}
      </div>
    </section>
  );
}
