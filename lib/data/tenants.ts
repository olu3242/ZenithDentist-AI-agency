import type { Json } from "@/lib/database.types";
import { createServiceClient } from "@/lib/supabase/server";
import { getDefaultTenantContext, type TenantContext } from "@/lib/tenant";

export interface Organization {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  organization_type: "single_practice" | "multi_location" | "dso" | "enterprise";
  practice_size: number;
  active_plan: "starter" | "growth" | "enterprise";
  onboarding_status: "not_started" | "baseline" | "workflows" | "review" | "live";
  settings: Json;
  branding: Json;
  timezone: string;
  primary_location_id: string | null;
}

export interface Location {
  id: string;
  organization_id: string;
  created_at: string;
  name: string;
  slug: string;
  address: string | null;
  timezone: string;
  chair_count: number;
  is_primary: boolean;
  settings: Json;
}

export interface SubscriptionPlan {
  id: string;
  plan_key: "starter" | "growth" | "enterprise";
  name: string;
  price_monthly: number;
  included_locations: number;
  included_usage: Json;
  features: Json;
  stripe_price_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UsageMetric {
  id: string;
  organization_id: string;
  location_id: string | null;
  metric_month: string;
  reminders_sent: number;
  recalls_processed: number;
  reviews_generated: number;
  portal_users: number;
  reports_generated: number;
  ai_insights_consumed: number;
  created_at: string;
}

export interface BenchmarkSnapshot {
  id: string;
  organization_id: string | null;
  location_id: string | null;
  benchmark_date: string;
  cohort: string;
  no_show_rate_p50: number;
  recall_recovery_p50: number;
  review_conversion_p50: number;
  admin_efficiency_p50: number;
  percentile_rankings: Json;
  created_at: string;
}

export interface TenantData {
  tenant: TenantContext;
  organization: Organization;
  locations: Location[];
  plans: SubscriptionPlan[];
  usage: UsageMetric[];
  benchmarks: BenchmarkSnapshot[];
}

export async function getTenantData(slug = getDefaultTenantContext().organizationSlug): Promise<TenantData> {
  const supabase = createServiceClient();
  if (!supabase) return seededTenantData(slug);

  const { data: org } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
  if (!org) return seededTenantData(slug);

  const [locations, plans, usage, benchmarks] = await Promise.all([
    supabase.from("locations").select("*").eq("organization_id", org.id).order("is_primary", { ascending: false }),
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("price_monthly", { ascending: true }),
    supabase.from("usage_metrics").select("*").eq("organization_id", org.id).order("metric_month", { ascending: false }).limit(12),
    supabase.from("benchmark_snapshots").select("*").or(`organization_id.eq.${org.id},organization_id.is.null`).order("benchmark_date", { ascending: false }).limit(20)
  ]);

  return {
    tenant: { organizationId: org.id, organizationSlug: org.slug },
    organization: org,
    locations: locations.data ?? [],
    plans: plans.data ?? [],
    usage: usage.data ?? [],
    benchmarks: benchmarks.data ?? []
  };
}

export function seededTenantData(slug = "demo-dental-group"): TenantData {
  const organization: Organization = {
    id: "org-demo",
    created_at: new Date().toISOString(),
    name: "Demo Dental Group",
    slug,
    organization_type: "multi_location",
    practice_size: 3,
    active_plan: "growth",
    onboarding_status: "workflows",
    settings: {
      reminderCadence: ["48hr", "24hr", "2hr"],
      recallCadence: ["90d", "180d", "365d"],
      reviewTiming: "2hr_after_visit",
      escalationRules: { failedDelivery: "ops_alert", noShowRisk: "manager_digest" },
      thresholds: { noShowRate: 10, confirmationRate: 88 }
    },
    branding: { primaryColor: "#177f75", logoText: "Demo Dental Group" },
    timezone: "America/Chicago",
    primary_location_id: "loc-austin"
  };
  const locations: Location[] = [
    location("loc-austin", organization.id, "Austin Flagship", "austin", 7, true),
    location("loc-round-rock", organization.id, "Round Rock", "round-rock", 5, false),
    location("loc-cedar-park", organization.id, "Cedar Park", "cedar-park", 4, false)
  ];
  const plans: SubscriptionPlan[] = [
    plan("starter", "Starter", 799, 1, ["Reminder automation", "Monthly reporting"]),
    plan("growth", "Growth", 1499, 3, ["Recall intelligence", "Benchmarks", "Multi-location dashboards"]),
    plan("enterprise", "Enterprise", 3999, 25, ["Enterprise analytics", "Advanced benchmarks", "Dedicated success"])
  ];
  const usage: UsageMetric[] = [
    usageMetric(organization.id, null, "2026-05-01", 4820, 914, 81, 14, 8, 126),
    usageMetric(organization.id, null, "2026-04-01", 4310, 841, 72, 12, 7, 112)
  ];
  const benchmarks: BenchmarkSnapshot[] = [
    {
      id: "bench-demo",
      organization_id: organization.id,
      location_id: null,
      benchmark_date: "2026-05-01",
      cohort: "multi-location dental",
      no_show_rate_p50: 12.4,
      recall_recovery_p50: 24,
      review_conversion_p50: 22,
      admin_efficiency_p50: 58,
      percentile_rankings: { noShow: 72, recall: 81, reviews: 54, efficiency: 76 },
      created_at: new Date().toISOString()
    }
  ];

  return { tenant: { organizationId: organization.id, organizationSlug: slug }, organization, locations, plans, usage, benchmarks };
}

function location(id: string, organizationId: string, name: string, slug: string, chairCount: number, isPrimary: boolean): Location {
  return {
    id,
    organization_id: organizationId,
    created_at: new Date().toISOString(),
    name,
    slug,
    address: null,
    timezone: "America/Chicago",
    chair_count: chairCount,
    is_primary: isPrimary,
    settings: {}
  };
}

function plan(planKey: SubscriptionPlan["plan_key"], name: string, price: number, locations: number, features: string[]): SubscriptionPlan {
  return {
    id: `plan-${planKey}`,
    plan_key: planKey,
    name,
    price_monthly: price,
    included_locations: locations,
    included_usage: { reminders: planKey === "enterprise" ? 50000 : planKey === "growth" ? 6000 : 1500 },
    features,
    stripe_price_id: null,
    is_active: true,
    created_at: new Date().toISOString()
  };
}

function usageMetric(
  organizationId: string,
  locationId: string | null,
  month: string,
  reminders: number,
  recalls: number,
  reviews: number,
  users: number,
  reports: number,
  insights: number
): UsageMetric {
  return {
    id: `usage-${month}-${locationId ?? "org"}`,
    organization_id: organizationId,
    location_id: locationId,
    metric_month: month,
    reminders_sent: reminders,
    recalls_processed: recalls,
    reviews_generated: reviews,
    portal_users: users,
    reports_generated: reports,
    ai_insights_consumed: insights,
    created_at: new Date().toISOString()
  };
}
