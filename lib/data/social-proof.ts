import { createServiceClient } from "@/lib/supabase/server";

export interface Testimonial {
  id: string;
  author_name: string;
  author_title: string | null;
  practice_name: string | null;
  practice_location: string | null;
  quote: string;
  short_quote: string | null;
  rating: number | null;
  result_metric: string | null;
  result_value: string | null;
  is_featured: boolean;
  sort_order: number;
}

export interface CaseStudyPublic {
  id: string;
  title: string;
  slug: string | null;
  practice_type: string | null;
  practice_size: string | null;
  challenge: string;
  solution: string;
  result_summary: string;
  revenue_recovered: number | null;
  recall_rate_improvement: number | null;
  treatment_acceptance_improvement: number | null;
  timeframe_weeks: number | null;
  is_featured: boolean;
}

export interface SocialProofMetric {
  id: string;
  label: string;
  value: string;
  sub_label: string | null;
  icon: string | null;
  sort_order: number;
}

export interface GalleryCategory {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  sort_order: number;
}

export interface GalleryItem {
  id: string;
  category_id: string;
  title: string;
  caption: string;
  image_url: string | null;
  image_alt: string | null;
  stat_label: string | null;
  stat_value: string | null;
  cta_label: string | null;
  cta_href: string | null;
  component_type: "image" | "liz-card" | "score-card" | "metric-card";
  is_featured: boolean;
  sort_order: number;
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any).from("testimonials")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .limit(20);
  return data ?? [];
}

export async function getPublishedCaseStudies(): Promise<CaseStudyPublic[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any).from("case_studies_public")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .limit(12);
  return data ?? [];
}

export async function getSocialProofMetrics(): Promise<SocialProofMetric[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any).from("social_proof_metrics")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getFeaturedGalleryItems(): Promise<GalleryItem[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any).from("gallery_items")
    .select("*")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getGalleryItemsByCategory(categorySlug: string): Promise<GalleryItem[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data: category } = await (supabase as any).from("gallery_categories")
    .select("id")
    .eq("slug", categorySlug)
    .single();
  if (!category) return [];
  const { data } = await (supabase as any).from("gallery_items")
    .select("*")
    .eq("category_id", category.id)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}
