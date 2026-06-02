import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type TwinStatus = 'draft' | 'training' | 'ready' | 'active' | 'suspended';

export interface DigitalDentistTwin {
  id: string;
  organizationId: string;
  displayName: string;
  specialty: string | null;
  status: TwinStatus;
  avatarProfile: { id: string; provider: string; status: string } | null;
  voiceProfile: { id: string; provider: string; status: string } | null;
  activeAvatarVersionId: string | null;
  activeVoiceVersionId: string | null;
}

export async function createDigitalDentistTwin(opts: {
  organizationId: string;
  displayName: string;
  specialty?: string;
}): Promise<{ twinId: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { twinId: "" };

  const { data: avatar } = await (supabase as any).from("avatar_profiles").insert({
    organization_id: opts.organizationId,
    display_name: opts.displayName,
    specialty: opts.specialty ?? null,
    status: "draft",
  }).select("id").single();

  const { data: voice } = await (supabase as any).from("voice_profiles").insert({
    organization_id: opts.organizationId,
    display_name: opts.displayName,
    status: "draft",
  }).select("id").single();

  const twinId = avatar?.id ?? "";

  await publishRuntimeFabricEvent({
    eventKey: `avatar.created.${twinId}`,
    eventType: "agent",
    sourceSystem: "digital_dentist_twin",
    targetChannel: "platform",
    priority: "low",
    summary: `Digital dentist twin created: ${opts.displayName}`,
    payload: { avatarProfileId: twinId, voiceProfileId: voice?.id, displayName: opts.displayName },
  }).catch(() => {});

  return { twinId };
}

export async function getDigitalDentistTwin(organizationId: string, avatarProfileId: string): Promise<DigitalDentistTwin | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data: avatar } = await (supabase as any)
    .from("avatar_profiles").select("*").eq("id", avatarProfileId).eq("organization_id", organizationId).maybeSingle();
  if (!avatar) return null;

  const { data: voice } = await (supabase as any)
    .from("voice_profiles").select("id, voice_provider, status")
    .eq("organization_id", organizationId).eq("display_name", avatar.display_name).maybeSingle();

  return {
    id: avatar.id,
    organizationId,
    displayName: avatar.display_name,
    specialty: avatar.specialty,
    status: avatar.status,
    avatarProfile: { id: avatar.id, provider: avatar.avatar_provider, status: avatar.status },
    voiceProfile: voice ? { id: voice.id, provider: voice.voice_provider, status: voice.status } : null,
    activeAvatarVersionId: null,
    activeVoiceVersionId: null,
  };
}

export async function listDigitalDentistTwins(organizationId: string): Promise<DigitalDentistTwin[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any).from("avatar_profiles").select("id, display_name, specialty, status, avatar_provider")
    .eq("organization_id", organizationId).order("created_at", { ascending: false });
  return (data ?? []).map((a: Record<string, string>) => ({
    id: a.id, organizationId, displayName: a.display_name, specialty: a.specialty,
    status: a.status as TwinStatus, avatarProfile: { id: a.id, provider: a.avatar_provider, status: a.status },
    voiceProfile: null, activeAvatarVersionId: null, activeVoiceVersionId: null,
  }));
}

export async function activateDigitalDentistTwin(organizationId: string, avatarProfileId: string): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  await (supabase as any).from("avatar_profiles").update({ status: "active" })
    .eq("id", avatarProfileId).eq("organization_id", organizationId);
  await publishRuntimeFabricEvent({
    eventKey: `avatar.activated.${avatarProfileId}`,
    eventType: "agent",
    sourceSystem: "digital_dentist_twin",
    targetChannel: "platform",
    priority: "moderate",
    summary: `Digital dentist twin activated: ${avatarProfileId}`,
    payload: { avatarProfileId, action: "activated" },
  }).catch(() => {});
}
