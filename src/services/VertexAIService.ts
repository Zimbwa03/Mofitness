import type { AIUsageLogInput, VertexStructuredResponse } from "../models";
import supabaseService from "./SupabaseService";

type Schema = Record<string, unknown>;
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "").replace(/\/$/, "");

class VertexAIService {
  private readonly model = "gemini-2.5-pro";

  // WHY: Expo Go cannot safely bundle the server-side auth stack needed for direct
  // Vertex AI access. Until this moves behind an edge function, the mobile client
  // must fail soft instead of pulling Node-only dependencies into the bundle.
  private buildFallbackResponse<T>(): VertexStructuredResponse<T> {
    return {
      text: "",
      structuredData: null,
      usage: {
        inputTokens: null,
        outputTokens: null,
        model: `${this.model}-mobile-fallback`,
      },
      source: "cache",
    };
  }

  async generateContent<T>(
    prompt: string,
    systemInstruction: string,
    schema?: Schema,
  ): Promise<VertexStructuredResponse<T>> {
    if (!API_BASE_URL) {
      return this.buildFallbackResponse<T>();
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          prompt,
          systemInstruction,
          schema,
          model: this.model,
        }),
      });

      if (!response.ok) {
        return this.buildFallbackResponse<T>();
      }

      const data = (await response.json()) as Partial<VertexStructuredResponse<T>>;
      return {
        text: typeof data.text === "string" ? data.text : "",
        structuredData: (data.structuredData as T | null) ?? null,
        usage: {
          inputTokens: data.usage?.inputTokens ?? null,
          outputTokens: data.usage?.outputTokens ?? null,
          model: data.usage?.model ?? this.model,
        },
        source: data.source ?? "vertex",
      };
    } catch {
      return this.buildFallbackResponse<T>();
    }
  }

  async generateEmbedding(text: string) {
    if (!API_BASE_URL) {
      return [];
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/embedding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        return [];
      }
      const data = (await response.json()) as { embedding?: number[] };
      return Array.isArray(data.embedding) ? data.embedding : [];
    } catch {
      return [];
    }
  }

  async logUsage(input: AIUsageLogInput) {
    const client = supabaseService.getClient();
    await client.from("ai_usage_logs").insert(input);
  }
}

const vertexAIService = new VertexAIService();

export default vertexAIService;
