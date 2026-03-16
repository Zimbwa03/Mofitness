import type { UserWorkout, WellnessLog, WellnessRecommendation } from "../../models";
import { BaseAIService } from "./BaseAIService";
import { buildWellnessPrompt } from "./prompts";

const wellnessSchema = {
  type: "object",
  properties: {
    overtraining_risk: { type: "string" },
    sleep_recommendation_hours: { type: "number" },
    hydration_recommendation_liters: { type: "number" },
    stress_tips: { type: "array" },
    suggested_activities: { type: "array" },
    alert_message: { type: ["string", "null"] },
  },
  required: [
    "overtraining_risk",
    "sleep_recommendation_hours",
    "hydration_recommendation_liters",
    "stress_tips",
    "suggested_activities",
    "alert_message",
  ],
} as const;

export class WellnessService extends BaseAIService {
  async analyzeWellness(userId: string) {
    const [logs, workouts] = await Promise.all([
      this.client
        .from("wellness_logs")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(14),
      this.client
        .from("user_workouts")
        .select("*")
        .eq("user_id", userId)
        .order("completed_date", { ascending: false })
        .limit(14),
    ]);

    if (logs.error || workouts.error) {
      throw new Error("Unable to gather wellness analysis data.");
    }

    const prompt = buildWellnessPrompt(logs.data as WellnessLog[], workouts.data as UserWorkout[]);
    const response = await this.generateWithCache<WellnessRecommendation>({
      feature: "wellness_analysis",
      userId,
      prompt,
      systemInstruction:
        "You are a holistic wellness coach. Identify over-training risk and give actionable recommendations.",
      schema: wellnessSchema,
    });

    return response.structuredData;
  }

  getInjuryRisk(logs: WellnessLog[], workouts: UserWorkout[]) {
    const recentWorkouts = workouts.slice(0, 5);
    const recentLogs = logs.slice(0, 3);
    const averageDifficulty =
      recentWorkouts.length > 0
        ? recentWorkouts.reduce((sum, workout) => sum + (workout.perceived_difficulty ?? 0), 0) /
          recentWorkouts.length
        : 0;
    const averageStress =
      recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + (log.stress_level ?? 0), 0) / recentLogs.length
        : 0;
    const averageSleep =
      recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + (log.sleep_hours ?? 0), 0) / recentLogs.length
        : 8;

    return averageDifficulty >= 4 && averageStress >= 7 && averageSleep < 6;
  }
}

const wellnessService = new WellnessService();

export default wellnessService;
