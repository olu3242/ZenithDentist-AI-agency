import type { Json } from "@/lib/database.types";
import { createServiceClient } from "@/lib/supabase/server";
import { type TenantContext } from "@/lib/tenant";

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

export async function getTenantData(slug?: string): Promise<TenantData> {
  const resolvedSlug = slug ?? process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG;
  if (!resolvedSlug) return emptyTenantData();
  return _getTenantDataBySlug(resolvedSlug);
}

async function _getTenantDataBySlug(slug: string): Promise<TenantData> {
  const supabase = createServiceClient();
  if (!supabase) return emptyTenantData(slug);

  const { data: org } = await supabase.from("organizations").select("*").eq("slug", slug).maybeSingle();
  if (!org) return emptyTenantData(slug);


  const [locations, plans, usage, benchmarks] = await Promise.all([
    supabase.from("locations").select("*").eq("organization_id", org.id).order("is_primary", { ascending: false }),
    supabase.from("subscription_plans").select("*").eq("is_active", true).order("price_monthly", { ascending: true }),
    supabase.from("usage_metrics").select("*").eq("organization_id", org.id).order("metric_month", { ascending: false }).limit(12),
    supabase.from("benchmark_snapshots").select("*").in("organization_id", [org.id, null as unknown as string]).order("benchmark_date", { ascending: false }).limit(20)
  ]);

  return {
    tenant: { organizationId: org.id, organizationSlug: org.slug, userId: null, userEmail: null, membershipRole: "read_only" as const, permissions: [] },
    organization: org,
    locations: locations.data ?? [],
    plans: plans.data ?? [],
    usage: usage.data ?? [],
    benchmarks: benchmarks.data ?? []
  };
}

export function emptyTenantData(slug = "not-found"): TenantData {
  const organization: Organization = {
    id: "",
    created_at: new Date().toISOString(),
    name: "Organization not found",
    slug,
    organization_type: "single_practice",
    practice_size: 0,
    active_plan: "starter",
    onboarding_status: "not_started",
    settings: {},
    branding: {},
    timezone: "America/Chicago",
    primary_location_id: null
  };
  return { tenant: { organizationId: organization.id, organizationSlug: slug, userId: null, userEmail: null, membershipRole: "read_only" as const, permissions: [] }, organization, locations: [], plans: [], usage: [], benchmarks: [] };
}
