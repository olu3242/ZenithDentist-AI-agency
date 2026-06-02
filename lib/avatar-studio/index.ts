import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type AvatarProvider = 'heygen' | 'tavus' | 'synthesia' | 'd_id' | 'custom';

export interface AvatarProfile {
  id: string;
  organizationId: string;
  displayName: string;
  provider: AvatarProvider;
  status: string;
  providerAvatarId: string | null;
}

export async function createAvatarProfile(opts: {
  organizationId: string;
  displayName: string;
  provider: AvatarProvider;
  specialty?: string;
}): Promise<AvatarProfile | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await (supabase as any).from("avatar_profiles").insert({
    organization_id: opts.organizationId,
    display_name: opts.displayName,
    avatar_provider: opts.provider,
    specialty: opts.specialty ?? null,
    status: "draft",
  }).select("*").single();
  if (!data) return null;
  return {
    id: data.id,
    organizationId: opts.organizationId,
    displayName: data.display_name,
    provider: data.avatar_provider,
    status: data.status,
    providerAvatarId: data.provider_avatar_id,
  };
}

export async function dispatchAvatarTrainingJob(opts: {
  organizationId: string;
  avatarProfileId: string;
  jobType: 'initial_training' | 'fine_tune' | 'style_update';
  assets: string[];
}): Promise<{ jobId: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { jobId: "" };
  const { data } = await (supabase as any).from("avatar_training_jobs").insert({
    organization_id: opts.organizationId,
    avatar_profile_id: opts.avatarProfileId,
    job_type: opts.jobType,
    status: "queued",
    assets_submitted: opts.assets,
    started_at: new Date().toISOString(),
  }).select("id").single();

  await (supabase as any).from("avatar_profiles").update({ status: "training" })
    .eq("id", opts.avatarProfileId).eq("organization_id", opts.organizationId);

  await publishRuntimeFabricEvent({
    eventKey: `avatar.training.${opts.avatarProfileId}`,
    eventType: "agent",
    sourceSystem: "avatar_studio",
    targetChannel: "platform",
    priority: "moderate",
    summary: `Avatar training job dispatched: ${opts.jobType}`,
    payload: { avatarProfileId: opts.avatarProfileId, jobId: data?.id },
  }).catch(() => {});

  return { jobId: data?.id ?? "" };
}

export async function getAvatarProfile(organizationId: string, avatarProfileId: string): Promise<AvatarProfile | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await (supabase as any).from("avatar_profiles").select("*")
    .eq("id", avatarProfileId).eq("organization_id", organizationId).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    organizationId,
    displayName: data.display_name,
    provider: data.avatar_provider,
    status: data.status,
    providerAvatarId: data.provider_avatar_id,
  };
}

export async function listAvatarProfiles(organizationId: string): Promise<AvatarProfile[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any).from("avatar_profiles")
    .select("id, display_name, avatar_provider, status, provider_avatar_id")
    .eq("organization_id", organizationId).order("created_at", { ascending: false });
  return (data ?? []).map((d: Record<string, string>) => ({
    id: d.id,
    organizationId,
    displayName: d.display_name,
    provider: d.avatar_provider as AvatarProvider,
    status: d.status,
    providerAvatarId: d.provider_avatar_id,
  }));
}
