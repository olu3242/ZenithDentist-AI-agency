import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export type PortalItemType =
  | 'video'
  | 'education'
  | 'treatment_guide'
  | 'recovery_instructions'
  | 'membership_content'
  | 'follow_up';

export interface PatientPortalItem {
  id: string;
  title: string;
  itemType: PortalItemType;
  contentUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function getPatientPortalItems(
  organizationId: string,
  patientExternalId: string
): Promise<PatientPortalItem[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any).from("patient_portal_items")
    .select("id, title, item_type, content_url, is_read, created_at")
    .eq("organization_id", organizationId).eq("patient_external_id", patientExternalId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((d: Record<string, string | boolean>) => ({
    id: d.id as string,
    title: d.title as string,
    itemType: d.item_type as PortalItemType,
    contentUrl: d.content_url as string | null,
    isRead: d.is_read as boolean,
    createdAt: d.created_at as string,
  }));
}

export async function addPatientPortalItem(opts: {
  organizationId: string;
  patientExternalId: string;
  itemType: PortalItemType;
  title: string;
  contentUrl?: string;
  journeyAssignmentId?: string;
}): Promise<{ itemId: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { itemId: "" };
  const { data } = await (supabase as any).from("patient_portal_items").insert({
    organization_id: opts.organizationId,
    patient_external_id: opts.patientExternalId,
    item_type: opts.itemType,
    title: opts.title,
    content_url: opts.contentUrl ?? null,
    journey_assignment_id: opts.journeyAssignmentId ?? null,
  }).select("id").single();
  return { itemId: data?.id ?? "" };
}

export async function markPortalItemRead(organizationId: string, itemId: string): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  await (supabase as any).from("patient_portal_items")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", itemId).eq("organization_id", organizationId);
}
