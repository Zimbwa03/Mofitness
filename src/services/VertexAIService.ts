import type { AIUsageLogInput, VertexStructuredResponse } from "../models";
import supabaseService from "./SupabaseService";

type Schema = Record<string, unknown>;

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
    _prompt: string,
    _systemInstruction: string,
    _schema?: Schema,
  ): Promise<VertexStructuredResponse<T>> {
    return this.buildFallbackResponse<T>();
  }

  async generateEmbedding(_text: string) {
    return [];
  }

  async logUsage(input: AIUsageLogInput) {
    const client = supabaseService.getClient();
    await client.from("ai_usage_logs").insert(input);
  }
}

const vertexAIService = new VertexAIService();

export default vertexAIService;
