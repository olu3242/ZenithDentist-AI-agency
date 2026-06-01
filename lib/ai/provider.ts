import { env } from "@/lib/env";

export interface IntelligenceRequest {
  system: string;
  prompt: string;
  context: Record<string, unknown>;
}

export interface IntelligenceResponse {
  content: string;
  provider: "local" | "openai" | "anthropic";
  model: string;
}

export interface IntelligenceProvider {
  complete(request: IntelligenceRequest): Promise<IntelligenceResponse>;
}

class LocalProvider implements IntelligenceProvider {
  async complete(request: IntelligenceRequest): Promise<IntelligenceResponse> {
    return {
      provider: "local",
      model: "local-operational-core",
      content: `${request.system}\n\n${request.prompt}`
    };
  }
}

class OpenAIProvider extends LocalProvider {
  async complete(request: IntelligenceRequest): Promise<IntelligenceResponse> {
    if (!env.OPENAI_API_KEY) return super.complete(request);
    return {
      provider: "openai",
      model: "provider-ready",
      content: `${request.system}\n\n${request.prompt}`
    };
  }
}

class AnthropicProvider extends LocalProvider {
  async complete(request: IntelligenceRequest): Promise<IntelligenceResponse> {
    if (!env.ANTHROPIC_API_KEY) return super.complete(request);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: request.system,
          messages: [{ role: "user", content: request.prompt }]
        })
      });
      if (!response.ok) {
        const err = await response.text();
        console.error("[AnthropicProvider] API error:", response.status, err);
        return super.complete(request);
      }
      const data = await response.json() as { content: Array<{ text: string }> };
      return {
        provider: "anthropic",
        model: "claude-haiku-4-5-20251001",
        content: data.content[0]?.text ?? ""
      };
    } catch (error) {
      console.error("[AnthropicProvider] fetch error:", error);
      return super.complete(request);
    }
  }
}

export function getIntelligenceProvider(): IntelligenceProvider {
  if (env.AI_PROVIDER === "openai") return new OpenAIProvider();
  if (env.AI_PROVIDER === "anthropic") return new AnthropicProvider();
  return new LocalProvider();
}
