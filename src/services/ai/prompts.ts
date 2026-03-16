import type { Preferences, UserProfile, UserWorkout, WellnessLog, Workout } from "../../models";
import { calculateAge } from "../../utils/calories";

export const buildTrainingPlanPrompt = (
  user: UserProfile,
  prefs: Preferences,
  availableWorkouts: Workout[],
  recentLogs: UserWorkout[],
) => `
Generate a 7-day personalized training plan for the following user.

USER PROFILE:
- Age: ${calculateAge(user.date_of_birth)} years
- Gender: ${user.gender ?? "not provided"}
- Experience: ${user.experience_level}
- Activity level: ${user.activity_level ?? "not provided"}
- Goals: ${user.goals.join(", ")}
- Sport focus: ${prefs.sport_focus || "none"}

CONSTRAINTS:
- Available equipment: ${prefs.available_equipment.join(", ") || "bodyweight"}
- Training days per week: ${prefs.training_days_per_week ?? 3}
- Preferred time: ${prefs.preferred_workout_time ?? "not provided"}
- Medical conditions: ${prefs.medical_conditions || "none"}

RECENT PERFORMANCE (last 5 workouts):
${recentLogs
  .map((log) => `- ${log.workout_id}: rating=${log.rating}, difficulty=${log.perceived_difficulty}`)
  .join("\n")}

AVAILABLE WORKOUT IDs (select only from these):
${availableWorkouts
  .map(
    (workout) =>
      `- id:${workout.id} name:${workout.name} category:${workout.category} difficulty:${workout.difficulty}`,
  )
  .join("\n")}

Return a weekly plan using ONLY the workout IDs listed above. Distribute rest days appropriately.
`;

export const buildMealPlanPrompt = (
  user: UserProfile,
  prefs: Preferences,
  todayWorkout: Workout | null,
) => `
Create a full-day meal plan for the following person. Prioritize locally available African ingredients (sadza, ugali, morogo, biltong, tilapia, groundnut stew, cassava, plantain, samp, pap, beans, sweet potato, mango, avocado).

PROFILE:
- Age: ${calculateAge(user.date_of_birth)}, Gender: ${user.gender ?? "not provided"}
- Weight: ${user.weight_kg ?? "unknown"}kg, Height: ${user.height_cm ?? "unknown"}cm
- Goals: ${user.goals.join(", ")}
- Dietary restrictions: ${prefs.dietary_restrictions.join(", ") || "none"}
- Today's workout: ${todayWorkout ? `${todayWorkout.name} (${todayWorkout.calories_estimate ?? 0} kcal estimated burn)` : "Rest day"}

Calculate TDEE and set meal calories accordingly. Include breakfast, lunch, dinner, and 1-2 snacks.
`;

export const buildWellnessPrompt = (logs: WellnessLog[], workouts: UserWorkout[]) => `
Analyze this athlete's wellness and recovery data for the past 14 days and provide recommendations.

WELLNESS LOGS:
${logs
  .map(
    (log) =>
      `${log.date}: sleep=${log.sleep_hours}h, water=${log.water_liters}L, stress=${log.stress_level}/10, mood=${log.mood}`,
  )
  .join("\n")}

TRAINING LOAD:
${workouts
  .map(
    (workout) =>
      `${workout.completed_date}: calories=${workout.calories_burned}, difficulty=${workout.perceived_difficulty}/5`,
  )
  .join("\n")}

Identify patterns. Assess over-training risk. Provide 3 specific, actionable wellness tips tailored to this data.
`;
