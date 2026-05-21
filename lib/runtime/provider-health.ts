import "server-only";

import { getTenantData } from "@/lib/data/tenants";
import { getRuntimeHealthState, type RuntimeHealthState } from "@/lib/runtime/automation-health";
import { createServiceClient } from "@/lib/supabase/server";

export interface ProviderHealth {
  providerKey: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  uptimeScore: number;
  latencyMs: number | null;
  retryRate: number;
  failureRate: number;
  dependencyImpact: number;
  confidence: number;
}

const providerMap = [
  { providerKey: "supabase", markers: ["supabase", "database", "service role"] },
  { providerKey: "resend", markers: ["resend", "email"] },
  { providerKey: "openai", markers: ["openai", "provider"] },
  { providerKey: "twilio", markers: ["sms", "twilio"] },
  { providerKey: "open_dental", markers: ["open_dental", "open dental"] }
];

export async function getProviderHealth() {
  const runtime = await getRuntimeHealthState();
  return calculateProviderHealth(runtime);
}

export async function captureProviderHealthSnapshot() {
  const [runtime, tenant] = await Promise.all([getRuntimeHealthState(), getTenantData()]);
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const providers = calculateProviderHealth(runtime);
  const supabase = createServiceClient();
  if (!supabase || !providers.length) return { persisted: 0, providers };

  const { error } = await supabase.from("provider_health_snapshots").insert(
    providers.map(provider => ({
      organization_id: organizationId,
      provider_key: provider.providerKey,
      status: provider.status,
      uptime_score: provider.uptimeScore,
      latency_ms: provider.latencyMs,
      retry_rate: provider.retryRate,
      failure_rate: provider.failureRate,
      dependency_impact: provider.dependencyImpact,
      confidence: provider.confidence
    }))
  );
  if (error) throw new Error(`Unable to persist provider health snapshot: ${error.message}`);
  return { persisted: providers.length, providers };
}

export function calculateProviderHealth(runtime: RuntimeHealthState): ProviderHealth[] {
  return providerMap.map(provider => {
    const related = runtime.traces.filter(trace => {
      const haystack = `${trace.workflow_id} ${trace.event_name} ${trace.failure_reason ?? ""}`.toLowerCase();
      return provider.markers.some(marker => haystack.includes(marker));
    });
    const failures = related.filter(trace => trace.status === "failed").length;
    const retries = related.reduce((sum, trace) => sum + trace.retry_count, 0);
    const latencyCount = related.filter(trace => trace.latency_ms !== null).length;
    const avgLatency = latencyCount ? Math.round(related.reduce((sum, trace) => sum + (trace.latency_ms ?? 0), 0) / latencyCount) : null;
    const failureRate = related.length ? failures / related.length : 0;
    const retryRate = related.length ? retries / related.length : 0;
    const uptimeScore = related.length ? Math.max(0, Math.round(100 - failureRate * 100 - retryRate * 8)) : 0;
    return {
      providerKey: provider.providerKey,
      status: related.length ? uptimeScore > 90 ? "healthy" : uptimeScore > 60 ? "degraded" : "down" : "unknown",
      uptimeScore,
      latencyMs: avgLatency,
      retryRate,
      failureRate,
      dependencyImpact: Math.min(100, Math.round(failures * 20 + retries * 5)),
      confidence: related.length ? Math.min(0.95, 0.55 + related.length * 0.05) : 0
    };
  });
}
