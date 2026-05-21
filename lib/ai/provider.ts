import { env } from "@/lib/env";

export interface IntelligenceRequest {
  system: string;
  prompt: string;
  context: Record<string, unknown>;
}

export interface IntelligenceResponse {
  content: string;
  provider: "mock" | "openai" | "anthropic";
  model: string;
}

export interface IntelligenceProvider {
  complete(request: IntelligenceRequest): Promise<IntelligenceResponse>;
}

class MockProvider implements IntelligenceProvider {
  async complete(request: IntelligenceRequest): Promise<IntelligenceResponse> {
    return {
      provider: "mock",
      model: "deterministic-operational-core",
      content: `${request.system}\n\n${request.prompt}`
    };
  }
}

class OpenAIProvider extends MockProvider {
  async complete(request: IntelligenceRequest): Promise<IntelligenceResponse> {
    if (!env.OPENAI_API_KEY) return super.complete(request);
    return {
      provider: "openai",
      model: "provider-ready",
      content: `${request.system}\n\n${request.prompt}`
    };
  }
}

class AnthropicProvider extends MockProvider {
  async complete(request: IntelligenceRequest): Promise<IntelligenceResponse> {
    if (!env.ANTHROPIC_API_KEY) return super.complete(request);
    return {
      provider: "anthropic",
      model: "provider-ready",
      content: `${request.system}\n\n${request.prompt}`
    };
  }
}

export function getIntelligenceProvider(): IntelligenceProvider {
  if (env.AI_PROVIDER === "openai") return new OpenAIProvider();
  if (env.AI_PROVIDER === "anthropic") return new AnthropicProvider();
  return new MockProvider();
}
