import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type ReputationSummary = {
  organizationId: string;
  totalReviews: number;
  averageRating: number;
  reviewsThisMonth: number;
  reviewsThisWeek: number;
  responseRate: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  platformBreakdown: Record<string, number>;
};

export async function recordReviewRequest(
  organizationId: string,
  patientExternalId: string,
  platform?: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  (async () => {
    try {
      await (supabase as any).from("reputation_events").insert({
        organization_id: organizationId,
        patient_external_id: patientExternalId,
        event_type: "review_requested",
        platform: platform ?? null,
        created_at: new Date().toISOString(),
      });
    } catch {}
  })();
}

export async function recordReviewReceived(opts: {
  organizationId: string;
  patientExternalId: string;
  platform: string;
  rating: number;
  reviewText?: string;
  sentiment?: string;
}): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  (async () => {
    try {
      await (supabase as any).from("reputation_events").insert({
        organization_id: opts.organizationId,
        patient_external_id: opts.patientExternalId,
        event_type: "review_received",
        platform: opts.platform,
        rating: opts.rating,
        review_text: opts.reviewText ?? null,
        sentiment: opts.sentiment ?? null,
        created_at: new Date().toISOString(),
      });
    } catch {}
  })();

  (async () => {
    try {
      await publishRuntimeFabricEvent({
        eventKey: "reputation.review.received",
        eventType: "agent",
        sourceSystem: "reputation_engine",
        targetChannel: "mission_control",
        priority: "moderate",
        summary: `Review received (${opts.rating} stars, ${opts.platform}) for org ${opts.organizationId}`,
        payload: {
          organizationId: opts.organizationId,
          patientExternalId: opts.patientExternalId,
          platform: opts.platform,
          rating: opts.rating,
          sentiment: opts.sentiment,
        },
      });
    } catch {}
  })();
}

export async function recordReviewResponse(
  organizationId: string,
  reviewEventId: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  (async () => {
    try {
      await (supabase as any)
        .from("reputation_events")
        .update({ responded_at: new Date().toISOString() })
        .eq("organization_id", organizationId)
        .eq("id", reviewEventId);

      await (supabase as any).from("reputation_events").insert({
        organization_id: organizationId,
        event_type: "review_responded",
        related_event_id: reviewEventId,
        created_at: new Date().toISOString(),
      });
    } catch {}
  })();
}

export async function getReputationSummary(organizationId: string): Promise<ReputationSummary> {
  const supabase = createServiceClient();

  const { data: rows } = supabase
    ? await (supabase as any)
        .from("reputation_events")
        .select("event_type, rating, sentiment, platform, created_at, responded_at")
        .eq("organization_id", organizationId)
    : { data: [] };

  const allRows: any[] = rows ?? [];
  const reviewRows = allRows.filter((r: any) => r.event_type === "review_received");
  const responseRows = allRows.filter((r: any) => r.event_type === "review_responded");

  const totalReviews = reviewRows.length;
  const ratings = reviewRows.map((r: any) => Number(r.rating ?? 0)).filter((v) => v > 0);
  const averageRating = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const reviewsThisMonth = reviewRows.filter((r: any) => r.created_at >= monthStart).length;
  const reviewsThisWeek = reviewRows.filter((r: any) => r.created_at >= weekStart).length;

  const responseRate = totalReviews > 0 ? Math.round((responseRows.length / totalReviews) * 100) / 100 : 0;

  const sentimentBreakdown = {
    positive: reviewRows.filter((r: any) => r.sentiment === "positive").length,
    neutral: reviewRows.filter((r: any) => r.sentiment === "neutral" || !r.sentiment).length,
    negative: reviewRows.filter((r: any) => r.sentiment === "negative").length,
  };

  const platformBreakdown: Record<string, number> = {};
  for (const row of reviewRows) {
    const p = (row.platform as string) ?? "unknown";
    platformBreakdown[p] = (platformBreakdown[p] ?? 0) + 1;
  }

  return {
    organizationId,
    totalReviews,
    averageRating,
    reviewsThisMonth,
    reviewsThisWeek,
    responseRate,
    sentimentBreakdown,
    platformBreakdown,
  };
}
