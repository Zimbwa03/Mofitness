import type { MealPlanDay, MealSuggestion, UserProfile, Workout } from "../../models";
import { calculateTDEE } from "../../utils/calories";
import { BaseAIService } from "./BaseAIService";
import { buildMealPlanPrompt } from "./prompts";

interface NutritionResponse extends MealPlanDay {
  hydration_target_liters: number;
}

const nutritionSchema = {
  type: "object",
  properties: {
    date: { type: "string" },
    meals: { type: "array" },
    total_calories: { type: "number" },
    hydration_target_liters: { type: "number" },
  },
  required: ["date", "meals", "total_calories", "hydration_target_liters"],
} as const;

export class NutritionService extends BaseAIService {
  async generateMealPlan(userId: string, date: string) {
    const [profile, preferences, todayWorkout] = await Promise.all([
      this.client.from("users").select("*").eq("id", userId).single<UserProfile>(),
      this.client.from("preferences").select("*").eq("user_id", userId).single(),
      this.client
        .from("user_workouts")
        .select("workout:workouts(*)")
        .eq("user_id", userId)
        .eq("scheduled_date", date)
        .maybeSingle<{ workout: Workout }>(),
    ]);

    if (profile.error || preferences.error) {
      throw new Error("Unable to gather data required to build a meal plan.");
    }

    const workout = todayWorkout.data?.workout ?? null;
    const prompt = `${buildMealPlanPrompt(profile.data, preferences.data, workout)} TDEE target: ${calculateTDEE(
      profile.data,
    )} kcal.`;

    const response = await this.generateWithCache<NutritionResponse>({
      feature: "nutrition_plan_generation",
      userId,
      prompt,
      systemInstruction:
        "You are a nutrition coach for Sub-Saharan African athletes. Return only structured JSON conforming to the provided schema.",
      schema: nutritionSchema,
    });

    if (!response.structuredData) {
      return null;
    }

    const { structuredData } = response;

    await this.client.from("meal_plans").upsert({
      user_id: userId,
      date,
      meals: structuredData.meals,
      total_calories: structuredData.total_calories,
      ai_generated: true,
    });

    return structuredData;
  }

  async logMeal(userId: string, date: string, meal: { meal: string; dishes: MealSuggestion[] }) {
    const { data, error } = await this.client
      .from("meal_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle<{ id: string; meals: Array<{ meal: string; dishes: MealSuggestion[] }> }>();

    if (error) {
      throw error;
    }

    const meals = data?.meals ?? [];
    const nextMeals = [...meals.filter((entry) => entry.meal !== meal.meal), meal];
    const totalCalories = nextMeals.reduce(
      (sum, entry) => sum + entry.dishes.reduce((inner, dish) => inner + dish.calories, 0),
      0,
    );

    await this.client.from("meal_plans").upsert({
      id: data?.id,
      user_id: userId,
      date,
      meals: nextMeals,
      total_calories: totalCalories,
      ai_generated: false,
    });
  }
}

const nutritionService = new NutritionService();

export default nutritionService;
