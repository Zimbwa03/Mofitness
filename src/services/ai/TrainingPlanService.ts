import type { UserProfile, UserWorkout, WellnessLog, Workout } from "../../models";
import { BaseAIService } from "./BaseAIService";
import { buildTrainingPlanPrompt } from "./prompts";

interface TrainingPlanWorkoutSlot {
  workout_id: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes: string;
}

interface TrainingPlanResponse {
  weeklyPlan: Array<{
    day: string;
    workouts: TrainingPlanWorkoutSlot[];
  }>;
}

const trainingPlanSchema = {
  type: "object",
  properties: {
    weeklyPlan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          workouts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                workout_id: { type: "string" },
                sets: { type: "number" },
                reps: { type: "number" },
                rest_seconds: { type: "number" },
                notes: { type: "string" },
              },
              required: ["workout_id", "sets", "reps", "rest_seconds", "notes"],
            },
          },
        },
        required: ["day", "workouts"],
      },
    },
  },
  required: ["weeklyPlan"],
} as const;

export class TrainingPlanService extends BaseAIService {
  async generateWeeklyPlan(userId: string) {
    const [profile, preferences, workouts, recentWorkouts, recentWellness] = await Promise.all([
      this.client.from("users").select("*").eq("id", userId).single<UserProfile>(),
      this.client.from("preferences").select("*").eq("user_id", userId).single(),
      this.client.from("workouts").select("*"),
      this.client
        .from("user_workouts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      this.client
        .from("wellness_logs")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(7),
    ]);

    if (profile.error || preferences.error || workouts.error || recentWorkouts.error || recentWellness.error) {
      throw new Error("Unable to gather data required to build a training plan.");
    }

    const availableWorkouts = (workouts.data as Workout[]).filter((workout) => {
      const equipment = preferences.data.available_equipment as string[];
      return workout.equipment_required.every(
        (requiredEquipment) => equipment.includes(requiredEquipment) || requiredEquipment === "bodyweight",
      );
    });

    const prompt = buildTrainingPlanPrompt(
      profile.data,
      preferences.data,
      availableWorkouts,
      recentWorkouts.data as UserWorkout[],
    );

    const response = await this.generateWithCache<TrainingPlanResponse>({
      feature: "training_plan_generation",
      userId,
      prompt,
      systemInstruction:
        "You are an expert personal trainer specializing in athletes from Sub-Saharan Africa. Return only structured JSON conforming to the provided schema.",
      schema: trainingPlanSchema,
    });

    const structuredPlan = response.structuredData;
    if (!structuredPlan) {
      return [];
    }

    const stressWindow = recentWellness.data as WellnessLog[];
    const averageStress =
      stressWindow.length > 0
        ? stressWindow.reduce((sum, log) => sum + (log.stress_level ?? 0), 0) / stressWindow.length
        : 0;
    const averageSleep =
      stressWindow.length > 0
        ? stressWindow.reduce((sum, log) => sum + (log.sleep_hours ?? 0), 0) / stressWindow.length
        : 8;

    const rows = structuredPlan.weeklyPlan.flatMap((dayPlan, dayIndex) =>
      dayPlan.workouts.map((slot) => {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + dayIndex);

        const workout = availableWorkouts.find((item) => item.id === slot.workout_id);
        const shouldSwapToRecovery =
          (averageStress >= 7 || averageSleep < 6) &&
          workout &&
          (workout.category === "strength" || workout.category === "cardio");

        const fallbackWorkout = shouldSwapToRecovery
          ? availableWorkouts.find((item) => item.category === "recovery" || item.category === "flexibility")
          : workout;

        return {
          user_id: userId,
          workout_id: fallbackWorkout?.id ?? slot.workout_id,
          scheduled_date: scheduledDate.toISOString().slice(0, 10),
          notes: slot.notes,
        };
      }),
    );

    if (rows.length > 0) {
      await this.client.from("user_workouts").insert(rows);
    }

    return rows;
  }

  async adjustPlanAfterWorkout(userId: string, userWorkoutId: string) {
    const { data, error } = await this.client
      .from("user_workouts")
      .select("*")
      .eq("id", userWorkoutId)
      .eq("user_id", userId)
      .single<UserWorkout>();

    if (error || !data) {
      throw new Error("Unable to locate the completed workout to adjust the plan.");
    }

    const updates: Record<string, unknown> = {};

    if ((data.perceived_difficulty ?? 0) <= 2 && (data.rating ?? 0) >= 4) {
      // WHY: low perceived difficulty + good rating implies underloaded programming.
      updates.notes = `${data.notes ?? ""} Increase next session load by 10%.`.trim();
    }

    if ((data.perceived_difficulty ?? 0) >= 4 || (data.rating ?? 0) <= 2) {
      // WHY: high strain or low satisfaction should downshift intensity before the next session.
      updates.notes = `${data.notes ?? ""} Schedule easier follow-up variation.`.trim();
    }

    if (Object.keys(updates).length > 0) {
      await this.client.from("user_workouts").update(updates).eq("id", userWorkoutId);
    }

    return updates;
  }
}

const trainingPlanService = new TrainingPlanService();

export default trainingPlanService;
