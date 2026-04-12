/**
 * Model Router — Task complexity-based auto-routing
 * Reference: soul-execution-engine-v2 Section 2.4, Task #3
 *
 * Complexity levels:
 *   simple  → gemini-flash / gpt-4o-mini   (greetings, FAQ)
 *   normal  → gpt-4o-mini                   (conversation, summary)
 *   complex → gpt-4o / claude-sonnet        (coding, analysis)
 */

import {
  OpenAIAdapter,
  AnthropicAdapter,
  GeminiAdapter,
  type ProviderAdapter,
  type LLMRequest,
  type LLMResponse,
  type LLMMessage,
} from "./providers.ts";

export type Complexity = "simple" | "normal" | "complex";

interface ModelRoute {
  provider: string;
  model: string;
}

// ─── Complexity Detection ───────────────────
const COMPLEX_KEYWORDS = [
  "코드", "code", "구현", "implement", "분석", "analyze", "analysis",
  "설계", "design", "architecture", "debug", "디버그", "refactor",
  "리팩토링", "알고리즘", "algorithm", "sql", "query", "api",
  "보안", "security", "성능", "performance", "최적화", "optimize",
];

const SIMPLE_KEYWORDS = [
  "안녕", "hello", "hi", "감사", "thanks", "네", "yes", "아니", "no",
  "괜찮", "ok", "좋아", "good", "뭐해", "what are you doing",
];

export function detectComplexity(message: string): Complexity {
  const lower = message.toLowerCase();
  const wordCount = message.split(/\s+/).length;

  // Short messages with simple keywords
  if (wordCount <= 5 && SIMPLE_KEYWORDS.some((k) => lower.includes(k))) {
    return "simple";
  }

  // Complex keywords detected
  if (COMPLEX_KEYWORDS.some((k) => lower.includes(k))) {
    return "complex";
  }

  // Long messages tend to be more complex
  if (wordCount > 100) return "complex";

  return "normal";
}

// ─── Model Routing Table ────────────────────
const ROUTE_TABLE: Record<Complexity, ModelRoute[]> = {
  simple: [
    { provider: "google", model: "gemini-2.0-flash" },
    { provider: "openai", model: "gpt-4o-mini" },
  ],
  normal: [
    { provider: "openai", model: "gpt-4o-mini" },
    { provider: "google", model: "gemini-2.0-flash" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
  ],
  complex: [
    { provider: "openai", model: "gpt-4o" },
    { provider: "anthropic", model: "claude-sonnet-4-20250514" },
    { provider: "openai", model: "gpt-4o-mini" }, // fallback
  ],
};

// ─── Model Router ───────────────────────────
export class ModelRouter {
  private adapters: Map<string, ProviderAdapter> = new Map();

  constructor() {
    const openai = new OpenAIAdapter();
    const anthropic = new AnthropicAdapter();
    const gemini = new GeminiAdapter();

    if (openai.isConfigured()) this.adapters.set("openai", openai);
    if (anthropic.isConfigured()) this.adapters.set("anthropic", anthropic);
    if (gemini.isConfigured()) this.adapters.set("google", gemini);

    console.log(
      `[ModelRouter] Configured providers: ${[...this.adapters.keys()].join(", ") || "NONE"}`
    );
  }

  /** Check if at least one LLM provider is available */
  isReady(): boolean {
    return this.adapters.size > 0;
  }

  /** Get available provider names */
  getProviders(): string[] {
    return [...this.adapters.keys()];
  }

  /**
   * Route and complete a request
   * @param soulModel - Soul's preferred model ("auto" = auto-route)
   * @param messages - Conversation messages
   * @param complexity - Override complexity detection
   */
  async complete(
    soulModel: string,
    messages: LLMMessage[],
    options?: {
      complexity?: Complexity;
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<LLMResponse> {
    // If soul has a specific model preference (not "auto")
    if (soulModel && soulModel !== "auto") {
      return this.completeWithExplicitModel(soulModel, messages, options);
    }

    // Auto-route based on complexity
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const complexity = options?.complexity || detectComplexity(lastUserMsg?.content || "");
    const routes = ROUTE_TABLE[complexity];

    // Try each route in priority order
    for (const route of routes) {
      const adapter = this.adapters.get(route.provider);
      if (!adapter) continue;

      try {
        const result = await adapter.complete({
          model: route.model,
          messages,
          temperature: options?.temperature,
          max_tokens: options?.max_tokens,
        });
        console.log(
          `[ModelRouter] ${complexity} → ${route.provider}/${route.model} ` +
          `(${result.usage.total_tokens} tokens)`
        );
        return result;
      } catch (err: any) {
        console.warn(
          `[ModelRouter] ${route.provider}/${route.model} failed: ${err.message}, trying next...`
        );
        continue;
      }
    }

    throw new Error(
      `[ModelRouter] All providers failed for complexity=${complexity}. ` +
      `Configured: ${this.getProviders().join(", ")}`
    );
  }

  /** Stream a completion (OpenAI only for now) */
  async *stream(
    soulModel: string,
    messages: LLMMessage[],
    options?: { temperature?: number; max_tokens?: number }
  ): AsyncGenerator<string> {
    const openai = this.adapters.get("openai") as OpenAIAdapter | undefined;
    if (!openai?.streamComplete) {
      throw new Error("[ModelRouter] Streaming requires OpenAI provider");
    }

    const model = soulModel !== "auto" ? soulModel : "gpt-4o-mini";
    yield* openai.streamComplete({
      model,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.max_tokens,
      stream: true,
    });
  }

  private async completeWithExplicitModel(
    model: string,
    messages: LLMMessage[],
    options?: { temperature?: number; max_tokens?: number }
  ): Promise<LLMResponse> {
    // Determine provider from model name
    let providerName: string;
    if (model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3")) {
      providerName = "openai";
    } else if (model.startsWith("claude")) {
      providerName = "anthropic";
    } else if (model.startsWith("gemini")) {
      providerName = "google";
    } else {
      providerName = "openai"; // default
    }

    const adapter = this.adapters.get(providerName);
    if (!adapter) {
      throw new Error(`[ModelRouter] Provider ${providerName} not configured for model ${model}`);
    }

    return adapter.complete({
      model,
      messages,
      temperature: options?.temperature,
      max_tokens: options?.max_tokens,
    });
  }
}

// ─── Singleton ──────────────────────────────
let _router: ModelRouter | null = null;

export function getModelRouter(): ModelRouter {
  if (!_router) {
    _router = new ModelRouter();
  }
  return _router;
}
