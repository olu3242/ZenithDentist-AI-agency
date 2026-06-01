import type { SubscriptionPlanKey } from "@/lib/database.types";
import { hasFeature } from "@/lib/features";

export function FeatureGate({
  plan,
  feature,
  children,
  fallback
}: {
  plan: SubscriptionPlanKey;
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (hasFeature(plan, feature)) return <>{children}</>;
  return (
    <>
      {fallback ?? (
        <div className="rounded border border-gold/30 bg-warning/10 p-4 text-sm font-bold text-[#F8FAFC]">
          Upgrade required for {feature.replace(/_/g, " ")}.
        </div>
      )}
    </>
  );
}
