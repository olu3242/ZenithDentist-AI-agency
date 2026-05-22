import "server-only";

import { performance } from "perf_hooks";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getIntelligenceProvider, type IntelligenceRequest } from "@/lib/ai/provider";
import { traceRequest } from "@/lib/security";

export interface AICompletionOptions extends IntelligenceRequest {
  correlationId?: string;
  organizationId?: string | null;
}

export async function createAIProvider() {
  const provider = getIntelligenceProvider();
  return {
    provider,
    health: await checkAIProviderHealth()
  };
}

export async function executeAICompletion(input: AICompletionOptions) {
  const started = performance.now();
  const correlationId = input.correlationId ?? traceRequest(new Request("https://local.ai"));
  const provider = getIntelligenceProvider();
  try {
    const response = await provider.complete(input);
    const latencyMs = Math.round(performance.now() - started);
    const tokenUsage = estimateTokenUsage(input.prompt, response.content);
    logAITelemetry({ correlationId, provider: response.provider, latencyMs, tokenUsage, organizationId: input.organizationId ?? null, status: "completed" });
    return { ...response, correlationId, latencyMs, tokenUsage };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - started);
    logAITelemetry({ correlationId, provider: env.AI_PROVIDER, latencyMs, tokenUsage: { prompt: 0, completion: 0, total: 0 }, organizationId: input.organizationId ?? null, status: "failed" });
    throw error;
  }
}

export async function* executeAIStream(input: AICompletionOptions) {
  const response = await executeAICompletion(input);
  yield response.content;
}

export async function checkAIProviderHealth() {
  const configured = env.AI_PROVIDER === "openai" ? Boolean(env.OPENAI_API_KEY) : env.AI_PROVIDER === "anthropic" ? Boolean(env.ANTHROPIC_API_KEY) : true;
  return {
    provider: env.AI_PROVIDER,
    configured,
    streaming: true,
    fallbackAvailable: env.AI_PROVIDER !== "local",
    capabilities: ["completion", "streaming", "telemetry"]
  };
}

export function logAITelemetry(input: {
  correlationId: string;
  provider: string;
  latencyMs: number;
  tokenUsage: { prompt: number; completion: number; total: number };
  organizationId: string | null;
  status: "completed" | "failed";
}) {
  logger.info("ai_runtime_telemetry", input);
}

function estimateTokenUsage(prompt: string, completion: string) {
  const promptTokens = Math.ceil(prompt.length / 4);
  const completionTokens = Math.ceil(completion.length / 4);
  return { prompt: promptTokens, completion: completionTokens, total: promptTokens + completionTokens };
}
