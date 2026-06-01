import "server-only";

export type OperationalErrorType = "configuration" | "tenant_scope" | "provider" | "queue" | "billing" | "ai" | "security" | "unknown";

export function classifyOperationalError(error: unknown): OperationalErrorType {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes("env") || message.includes("configuration")) return "configuration";
  if (message.includes("organization") || message.includes("tenant")) return "tenant_scope";
  if (message.includes("provider") || message.includes("openai") || message.includes("anthropic")) return "provider";
  if (message.includes("queue") || message.includes("retry")) return "queue";
  if (message.includes("stripe") || message.includes("billing")) return "billing";
  if (message.includes("ai") || message.includes("token")) return "ai";
  if (message.includes("auth") || message.includes("signature")) return "security";
  return "unknown";
}

export function groupIncident(input: { type: OperationalErrorType; organizationId?: string | null; fingerprint: string }) {
  return [input.type, input.organizationId ?? "global", input.fingerprint].join(":");
}
