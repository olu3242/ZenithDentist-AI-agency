import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface ChairUtilizationSnapshot {
  locationId?: string;
  snapshotDate: string;
  totalChairs: number;
  occupiedHours: number;
  availableHours: number;
  revenuePerChair?: number;
  metadata?: Record<string, unknown>;
}

export async function recordChairUtilization(
  organizationId: string,
  snapshot: ChairUtilizationSnapshot
) {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const utilizationPct =
    snapshot.availableHours > 0
      ? (snapshot.occupiedHours / snapshot.availableHours) * 100
      : 0;

  const { data, error } = await supabase
    .from("chair_utilization_snapshots")
    .insert(({
      organization_id: organizationId,
      location_id: snapshot.locationId ?? null,
      snapshot_date: snapshot.snapshotDate,
      total_chairs: snapshot.totalChairs,
      occupied_hours: snapshot.occupiedHours,
      available_hours: snapshot.availableHours,
      utilization_pct: utilizationPct,
      revenue_per_chair: snapshot.revenuePerChair ?? null,
      metadata: snapshot.metadata ?? {},
    } as never))
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function getChairUtilizationMetrics(organizationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return { snapshots: [], avgUtilization: null };

  const { data, error } = await supabase
    .from("chair_utilization_snapshots")
    .select("id, snapshot_date, total_chairs, occupied_hours, available_hours, utilization_pct, revenue_per_chair, created_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("snapshot_date", { ascending: false });

  if (error || !data) return { snapshots: [], avgUtilization: null };

  const utilPcts = data
    .map((row) => (row as Record<string, unknown>)["utilization_pct"] as number | null)
    .filter((v): v is number => v !== null);

  const avgUtilization = utilPcts.length > 0
    ? utilPcts.reduce((a, b) => a + b, 0) / utilPcts.length
    : null;

  return { snapshots: data, avgUtilization };
}
