import type {
  MealSuggestion,
  RecommendationItem,
  UserProfile,
  UserWorkout,
  WellnessLog,
  WellnessTip,
  Workout,
} from "../../models";
import { useRecommendationStore } from "../../stores/recommendationStore";
import { calculateTDEE } from "../../utils/calories";
import { hashString } from "../../utils/hash";
import { BaseAIService } from "./BaseAIService";

export class RecommendationEngine extends BaseAIService {
  private buildFeatureText(params: {
    profile: UserProfile;
    preferences: Record<string, unknown>;
    workouts: UserWorkout[];
    wellnessLogs: WellnessLog[];
  }) {
    const avgCalories =
      params.workouts.length > 0
        ? params.workouts.reduce((sum, workout) => sum + (workout.calories_burned ?? 0), 0) / params.workouts.length
        : 0;
    const avgSleep =
      params.wellnessLogs.length > 0
        ? params.wellnessLogs.reduce((sum, log) => sum + (log.sleep_hours ?? 0), 0) / params.wellnessLogs.length
        : 0;
    const avgStress =
      params.wellnessLogs.length > 0
        ? params.wellnessLogs.reduce((sum, log) => sum + (log.stress_level ?? 0), 0) / params.wellnessLogs.length
        : 0;

    return `User goals: ${params.profile.goals.join(", ")}. Experience level: ${params.profile.experience_level}. Activity type: ${
      params.preferences.activity_type ?? "mixed"
    }. Calories burned average: ${Math.round(avgCalories)}. Average sleep: ${avgSleep.toFixed(
      1,
    )}. Average stress: ${avgStress.toFixed(1)}. Sport focus: ${params.preferences.sport_focus ?? "none"}.`;
  }

  async updatePreferenceVector(userId: string) {
    const [profile, preferences, workouts, wellnessLogs, existingModel] = await Promise.all([
      this.client.from("users").select("*").eq("id", userId).single<UserProfile>(),
      this.client.from("preferences").select("*").eq("user_id", userId).single<Record<string, unknown>>(),
      this.client
        .from("user_workouts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      this.client
        .from("wellness_logs")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(5),
      this.client.from("ml_models").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (profile.error || preferences.error || workouts.error || wellnessLogs.error) {
      throw new Error("Unable to gather inputs for preference-vector generation.");
    }

    const featureText = this.buildFeatureText({
      profile: profile.data,
      preferences: preferences.data,
      workouts: workouts.data as UserWorkout[],
      wellnessLogs: wellnessLogs.data as WellnessLog[],
    });

    const inputHash = await hashString(featureText);
    if (existingModel.data?.input_hash === inputHash) {
      return;
    }

    const embedding = await this.vertexAI.generateEmbedding(featureText);
    await this.client.from("ml_models").upsert({
      user_id: userId,
      preferences_vector: embedding,
      input_hash: inputHash,
      last_updated: new Date().toISOString(),
    });
  }

  async getWorkoutRecommendations(userId: string) {
    await this.updatePreferenceVector(userId);

    const [profile, preferences, similarUsers, workouts] = await Promise.all([
      this.client.from("users").select("*").eq("id", userId).single<UserProfile>(),
      this.client.from("preferences").select("*").eq("user_id", userId).single<Record<string, unknown>>(),
      this.client.rpc("get_similar_users", { target_user_id: userId, top_n: 5 }),
      this.client.from("workouts").select("*"),
    ]);

    if (profile.error || preferences.error || similarUsers.error || workouts.error) {
      throw new Error("Unable to build workout recommendations.");
    }

    const equipment = (preferences.data.available_equipment as string[]) ?? [];
    const highRiskOnlyRecovery = false;
    const ranked = (workouts.data as Workout[])
      .filter((workout) => workout.equipment_required.every((item) => equipment.includes(item) || item === "bodyweight"))
      .filter((workout) => (profile.data.experience_level === "beginner" ? workout.difficulty !== "advanced" : true))
      .filter((workout) => (highRiskOnlyRecovery ? ["recovery", "flexibility"].includes(workout.category) : true))
      .sort((left, right) => {
        const leftBoost = left.sport_tag === preferences.data.sport_focus ? 1 : 0;
        const rightBoost = right.sport_tag === preferences.data.sport_focus ? 1 : 0;
        return rightBoost - leftBoost;
      })
      .slice(0, 5);

    const recommendationItems: RecommendationItem[] = ranked.map((workout) => ({
      id: workout.id,
      title: workout.name,
      subtitle: workout.category,
      type: "workout",
    }));
    useRecommendationStore.getState().setRecommendations(recommendationItems);

    return ranked;
  }

  async getMealRecommendations(userId: string): Promise<MealSuggestion[]> {
    const { data, error } = await this.client.from("users").select("*").eq("id", userId).single<UserProfile>();
    if (error) {
      throw new Error("Unable to load user profile for meal recommendations.");
    }

    const tdee = calculateTDEE(data);
    return [
      {
        name: "Groundnut stew with sweet potato",
        calories: Math.round(tdee * 0.3),
        protein_g: 30,
        carbs_g: 45,
        fat_g: 18,
      },
      {
        name: "Tilapia with sadza and greens",
        calories: Math.round(tdee * 0.35),
        protein_g: 35,
        carbs_g: 50,
        fat_g: 15,
      },
      {
        name: "Bean bowl with avocado",
        calories: Math.round(tdee * 0.2),
        protein_g: 18,
        carbs_g: 30,
        fat_g: 12,
      },
    ];
  }

  async getWellnessRecommendations(userId: string): Promise<WellnessTip[]> {
    const { data, error } = await this.client
      .from("wellness_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(3);

    if (error) {
      throw new Error("Unable to load wellness data for recommendations.");
    }

    const averageSleep =
      data.length > 0 ? data.reduce((sum, log) => sum + (log.sleep_hours ?? 0), 0) / data.length : 8;

    return averageSleep < 6
      ? [
          {
            id: "sleep-reset",
            title: "Recovery first",
            description: "Shift the next session lighter and aim for an earlier sleep window tonight.",
          },
        ]
      : [
          {
            id: "consistency",
            title: "Keep the rhythm",
            description: "Your recent recovery pattern looks stable. Keep hydration and sleep consistent.",
          },
        ];
  }
}

const recommendationEngine = new RecommendationEngine();

export default recommendationEngine;
