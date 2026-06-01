import type { SubscriptionPlanKey } from "@/lib/database.types";

export function SubscriptionBadge({ plan }: { plan: SubscriptionPlanKey }) {
  return (
    <span className="inline-flex min-h-8 items-center rounded-full bg-accent/10 px-3 text-xs font-black uppercase tracking-wider text-accent">
      {plan} plan
    </span>
  );
}
