/**
 * LLM Provider Adapters — Multi-model support
 * OpenAI, Anthropic, Google Gemini
 * Reference: soul-execution-engine-v2 Section 2.4
 */

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string | any[]; // string for text, array for multimodal (vision)
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason: string;
}

// ─── Base Adapter ───────────────────────────
export interface ProviderAdapter {
  name: string;
  isConfigured(): boolean;
  complete(req: LLMRequest): Promise<LLMResponse>;
  streamComplete?(req: LLMRequest): AsyncGenerator<string>;
}

// ─── Ollama Adapter (Local LLM) ─────────────
export class OllamaAdapter implements ProviderAdapter {
  name = "ollama";
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://bore.pub:4362";
  }

  isConfigured(): boolean {
    return !!process.env.OLLAMA_BASE_URL;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3_000); // 3s — 초과 시 router fallback

    try {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          model: req.model,
          messages: req.messages,
          temperature: req.temperature ?? 0.7,
          max_tokens: req.max_tokens ?? 1024,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Ollama API error (${res.status}): ${err}`);
      }

      const data = await res.json() as any;
      const choice = data.choices?.[0];
      return {
        content: choice?.message?.content || "",
        model: data.model || req.model,
        usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        finish_reason: choice?.finish_reason || "stop",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

// ─── OpenAI Adapter ─────────────────────────
export class OpenAIAdapter implements ProviderAdapter {
  name = "openai";
  private apiKey: string | undefined;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens ?? 2048,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content || "",
      model: data.model,
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      finish_reason: choice?.finish_reason || "stop",
    };
  }

  async *streamComplete(req: LLMRequest): AsyncGenerator<string> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens ?? 2048,
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI streaming error (${res.status}): ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") return;
        try {
          const chunk = JSON.parse(payload);
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // skip invalid JSON
        }
      }
    }
  }
}

// ─── Anthropic Adapter ──────────────────────
export class AnthropicAdapter implements ProviderAdapter {
  name = "anthropic";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    // Convert messages: separate system from conversation
    const systemMsg = req.messages.find((m) => m.role === "system");
    const conversationMsgs = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: req.model,
        system: systemMsg?.content || "",
        messages: conversationMsgs,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens ?? 2048,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    return {
      content: data.content?.[0]?.text || "",
      model: data.model,
      usage: {
        prompt_tokens: data.usage?.input_tokens || 0,
        completion_tokens: data.usage?.output_tokens || 0,
        total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
      finish_reason: data.stop_reason || "end_turn",
    };
  }
}

// ─── Google Gemini Adapter ──────────────────
export class GeminiAdapter implements ProviderAdapter {
  name = "google";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GOOGLE_AI_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async complete(req: LLMRequest): Promise<LLMResponse> {
    const systemMsg = req.messages.find((m) => m.role === "system");
    const conversationMsgs = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${req.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
          contents: conversationMsgs,
          generationConfig: {
            temperature: req.temperature ?? 0.7,
            maxOutputTokens: req.max_tokens ?? 2048,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const usage = data.usageMetadata || {};
    return {
      content: text,
      model: req.model,
      usage: {
        prompt_tokens: usage.promptTokenCount || 0,
        completion_tokens: usage.candidatesTokenCount || 0,
        total_tokens: usage.totalTokenCount || 0,
      },
      finish_reason: data.candidates?.[0]?.finishReason || "STOP",
    };
  }
}
