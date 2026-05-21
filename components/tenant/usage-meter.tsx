import type { UsageMetric, SubscriptionPlan } from "@/lib/data/tenants";

export function UsageMeter({ usage, plan }: { usage?: UsageMetric; plan?: SubscriptionPlan }) {
  const included = Number((plan?.included_usage as Record<string, number> | undefined)?.reminders ?? 1500);
  const used = usage?.reminders_sent ?? 0;
  const pct = Math.min(100, Math.round((used / Math.max(1, included)) * 100));

  return (
    <section className="rounded border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">Usage Meter</h2>
          <p className="text-sm text-muted">Subscription-ready consumption tracking.</p>
        </div>
        <strong>{pct}%</strong>
      </div>
      <div className="mt-4 h-3 rounded-full bg-paper">
        <div className="h-full rounded-full bg-teal" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 grid gap-2 text-sm text-muted md:grid-cols-3">
        <span>{used.toLocaleString()} reminders sent</span>
        <span>{usage?.recalls_processed ?? 0} recalls processed</span>
        <span>{usage?.ai_insights_consumed ?? 0} AI insights consumed</span>
      </div>
    </section>
  );
}
