import { formatCurrency } from "@/lib/utils";
import { BookingFlow } from "@/components/public/booking-flow";

export function AuditPreview({
  projectedRecovery,
  calendlyUrl,
  leadId
}: {
  projectedRecovery?: number;
  calendlyUrl: string;
  leadId?: string;
}) {
  return (
    <section id="audit" className="rounded border border-line bg-white p-6 shadow-soft">
      <p className="text-xs font-black uppercase tracking-wider text-teal">Audit preview</p>
      <h3 className="mt-3 text-3xl font-black">Operational revenue recovery plan</h3>
      <p className="mt-3 text-muted">
        Once the calculator is submitted, Zenith generates a structured audit with projected recovery, operational drag,
        recall gaps, and reminder priorities.
      </p>
      <div className="mt-5 rounded bg-paper p-5">
        <span className="text-sm font-bold text-muted">Projected monthly recovery</span>
        <strong className="mt-2 block text-4xl font-black text-green">
          {projectedRecovery ? formatCurrency(projectedRecovery) : "Pending calculation"}
        </strong>
      </div>
      <ul className="mt-5 grid gap-3 text-sm text-muted">
        <li>Confirmation stack across 48hr, 24hr, and 2hr windows</li>
        <li>Recall segmentation for 90, 180, and 365 day lapsed patients</li>
        <li>Admin workload recovery and front desk capacity plan</li>
      </ul>
      <div className="mt-6">
        <BookingFlow calendlyUrl={calendlyUrl} leadId={leadId} />
      </div>
    </section>
  );
}
