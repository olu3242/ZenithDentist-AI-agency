import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type VoiceProvider = 'elevenlabs' | 'azure' | 'google' | 'deepgram' | 'custom';

export interface VoiceProfile {
  id: string;
  organizationId: string;
  displayName: string;
  provider: VoiceProvider;
  status: string;
  providerVoiceId: string | null;
}

export async function createVoiceProfile(opts: {
  organizationId: string;
  displayName: string;
  provider: VoiceProvider;
}): Promise<VoiceProfile | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await (supabase as any).from("voice_profiles").insert({
    organization_id: opts.organizationId,
    display_name: opts.displayName,
    voice_provider: opts.provider,
    status: "draft",
  }).select("*").single();
  if (!data) return null;
  return {
    id: data.id,
    organizationId: opts.organizationId,
    displayName: data.display_name,
    provider: data.voice_provider,
    status: data.status,
    providerVoiceId: data.provider_voice_id,
  };
}

export async function dispatchVoiceTrainingJob(opts: {
  organizationId: string;
  voiceProfileId: string;
  jobType: 'initial_training' | 'fine_tune';
  samples: string[];
}): Promise<{ jobId: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { jobId: "" };
  const { data } = await (supabase as any).from("voice_training_jobs").insert({
    organization_id: opts.organizationId,
    voice_profile_id: opts.voiceProfileId,
    job_type: opts.jobType,
    status: "queued",
    assets_submitted: opts.samples,
    started_at: new Date().toISOString(),
  }).select("id").single();

  await (supabase as any).from("voice_profiles").update({ status: "training" })
    .eq("id", opts.voiceProfileId).eq("organization_id", opts.organizationId);

  await publishRuntimeFabricEvent({
    eventKey: `voice.training.${opts.voiceProfileId}`,
    eventType: "agent",
    sourceSystem: "voice_studio",
    targetChannel: "platform",
    priority: "moderate",
    summary: `Voice training job dispatched: ${opts.jobType}`,
    payload: { voiceProfileId: opts.voiceProfileId, jobId: data?.id },
  }).catch(() => {});

  return { jobId: data?.id ?? "" };
}

export async function listVoiceProfiles(organizationId: string): Promise<VoiceProfile[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any).from("voice_profiles")
    .select("id, display_name, voice_provider, status, provider_voice_id")
    .eq("organization_id", organizationId);
  return (data ?? []).map((d: Record<string, string>) => ({
    id: d.id,
    organizationId,
    displayName: d.display_name,
    provider: d.voice_provider as VoiceProvider,
    status: d.status,
    providerVoiceId: d.provider_voice_id,
  }));
}
