import { NextResponse } from "next/server";
import { getAutomationQueueMetrics } from "@/lib/automation/runtime";
import { checkAIProviderHealth } from "@/lib/ai/runtime";
import { getRuntimeDiagnostics, validateRuntimeConfig } from "@/lib/runtime-config";
import { getBillingStatus } from "@/lib/stripe/operations";
import { getAnalyticsDestinations } from "@/lib/telemetry/gtm";
import { current_org_id } from "@/lib/tenant";

export async function GET() {
  const organizationId = await current_org_id();
  const [queue, aiProviderHealth, billing] = await Promise.all([
    getAutomationQueueMetrics(organizationId ?? undefined),
    checkAIProviderHealth(),
    getBillingStatus(organizationId ?? undefined)
  ]);

  return NextResponse.json({
    organizationId,
    runtimeDiagnostics: getRuntimeDiagnostics(),
    validation: safeValidate(),
    queue,
    ai: {
      providerHealth: aiProviderHealth,
      tokenConsumption: { prompt: 0, completion: 0, total: 0 },
      usageWindow: "live telemetry only"
    },
    stripe: billing,
    telemetry: getAnalyticsDestinations(),
    deployment: {
      nodeEnv: process.env.NODE_ENV,
      version: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.npm_package_version ?? "local"
    },
    realtime: {
      configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    }
  });
}

function safeValidate() {
  try {
    validateRuntimeConfig();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Runtime validation failed." };
  }
}
