import type { AIUsageLogInput, VertexStructuredResponse } from "../../models";
import { hashString } from "../../utils/hash";
import supabaseService from "../SupabaseService";
import vertexAIService from "../VertexAIService";

export abstract class BaseAIService {
  protected client = supabaseService.getClient();
  protected vertexAI = vertexAIService;

  protected async getCachedResponse<T>(cacheKey: string) {
    const { data, error } = await this.client
      .from("ai_cache")
      .select("response, expires_at")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle<{ response: string; expires_at: string }>();

    if (error || !data) {
      return null;
    }

    return JSON.parse(data.response) as T;
  }

  protected async setCachedResponse(cacheKey: string, response: unknown) {
    await this.client.from("ai_cache").upsert({
      cache_key: cacheKey,
      response: JSON.stringify(response),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  protected async createCacheKey(feature: string, userId: string, prompt: string) {
    return hashString(`${feature}:${userId}:${prompt}`);
  }

  protected async generateWithCache<T>(params: {
    feature: string;
    userId: string;
    prompt: string;
    systemInstruction: string;
    schema?: Record<string, unknown>;
  }): Promise<VertexStructuredResponse<T>> {
    const cacheKey = await this.createCacheKey(params.feature, params.userId, params.prompt);
    const cached = await this.getCachedResponse<T>(cacheKey);

    if (cached) {
      return {
        text: JSON.stringify(cached),
        structuredData: cached,
        usage: {
          inputTokens: null,
          outputTokens: null,
          model: "cache",
        },
        source: "cache",
      };
    }

    const response = await this.vertexAI.generateContent<T>(
      params.prompt,
      params.systemInstruction,
      params.schema,
    );

    if (response.structuredData) {
      await this.setCachedResponse(cacheKey, response.structuredData);
    }

    await this.logUsage({
      user_id: params.userId,
      feature: params.feature,
      input_tokens: response.usage.inputTokens,
      output_tokens: response.usage.outputTokens,
      model: response.usage.model,
    });

    return response;
  }

  protected async logUsage(input: AIUsageLogInput) {
    await this.vertexAI.logUsage(input);
  }
}
