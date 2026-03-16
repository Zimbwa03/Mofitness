import type { Preferences, UserProfile } from "../../models";
import type {
  AIWorkoutRecommendation,
  CustomWorkoutPlan,
  Exercise,
  FormFeedback,
  WorkoutTemplate,
} from "../../models/workout";
import exerciseLibraryService from "../ExerciseLibraryService";
import { BaseAIService } from "./BaseAIService";

interface WorkoutRecommendationSchemaResponse {
  recommendations: Array<{
    workout_id: string;
    match_score: number;
    match_reasons: string[];
    modifications: string[];
    warnings: string[];
  }>;
  generate_custom: boolean;
  custom_plan: {
    name: string;
    description: string;
    duration_minutes: number;
    exercises: Array<{
      exercise_name: string;
      sets: number;
      reps: string;
      rest_seconds: number;
      modification: string | null;
      cue: string;
    }>;
  } | null;
}

const workoutRecommendationSchema = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          workout_id: { type: "string" },
          match_score: { type: "number" },
          match_reasons: { type: "array", items: { type: "string" } },
          modifications: { type: "array", items: { type: "string" } },
          warnings: { type: "array", items: { type: "string" } },
        },
      },
    },
    generate_custom: { type: "boolean" },
    custom_plan: {
      type: "object",
      nullable: true,
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        duration_minutes: { type: "number" },
        exercises: {
          type: "array",
          items: {
            type: "object",
            properties: {
              exercise_name: { type: "string" },
              sets: { type: "number" },
              reps: { type: "string" },
              rest_seconds: { type: "number" },
              modification: { type: "string", nullable: true },
              cue: { type: "string" },
            },
          },
        },
      },
    },
  },
};

const SYSTEM_INSTRUCTION = `You are Mo, an elite personal trainer and sports scientist specializing in athletes from Sub-Saharan Africa.
When recommending workouts:
- Prioritize the user's goals and physical limitations
- Respect available equipment strictly
- Be conservative around injuries with low-impact alternatives
- Include one-sentence reason for each recommendation
- Return JSON only`;

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function getGoalHints(query: string) {
  const tokens = tokenize(query);

  const categories = new Set<WorkoutTemplate["category"]>();
  const muscles = new Set<string>();

  if (tokens.some((token) => ["fat", "burn", "cardio", "run", "conditioning"].includes(token))) {
    categories.add("cardio");
    categories.add("hiit");
  }
  if (tokens.some((token) => ["muscle", "mass", "strength", "power", "heavy"].includes(token))) {
    categories.add("strength");
  }
  if (tokens.some((token) => ["recover", "mobility", "stretch"].includes(token))) {
    categories.add("recovery");
    categories.add("flexibility");
  }
  if (tokens.some((token) => ["core", "posture", "stability", "brace"].includes(token))) {
    categories.add("core");
  }
  if (tokens.some((token) => ["sport", "speed", "jump", "explosive"].includes(token))) {
    categories.add("sport");
  }

  if (tokens.includes("legs") || tokens.includes("lower")) {
    muscles.add("quads");
    muscles.add("glutes");
    muscles.add("hamstrings");
  }
  if (tokens.includes("core") || tokens.includes("abs")) {
    muscles.add("core");
  }
  if (tokens.includes("chest")) {
    muscles.add("chest");
  }
  if (tokens.includes("back")) {
    muscles.add("back");
  }
  if (tokens.includes("shoulder") || tokens.includes("shoulders")) {
    muscles.add("shoulders");
  }
  if (tokens.includes("glutes") || tokens.includes("hips")) {
    muscles.add("glutes");
  }
  if (tokens.includes("posture")) {
    muscles.add("back");
    muscles.add("core");
  }

  return {
    tokens,
    categories: Array.from(categories),
    muscles: Array.from(muscles),
  };
}

function isEquipmentCompatible(workout: WorkoutTemplate, equipment: string[]) {
  if (workout.equipment.length === 0) {
    return true;
  }

  return workout.equipment.every((required) => equipment.includes(required));
}

export class WorkoutAIService extends BaseAIService {
  private buildFallbackRecommendations(
    userQuery: string,
    preferences: Preferences,
    availableWorkouts: WorkoutTemplate[],
  ): AIWorkoutRecommendation[] {
    const hints = getGoalHints(userQuery);
    const availableEquipment = preferences.available_equipment ?? [];

    const ranked = availableWorkouts
      .map((workout) => {
        let score = 0.2;
        const reasons: string[] = [];

        if (hints.categories.includes(workout.category)) {
          score += 0.35;
          reasons.push(`category match: ${workout.category}`);
        }

        const tagMatches = workout.goalTags.filter((tag) =>
          tag
            .split("_")
            .every((part) => hints.tokens.includes(part)),
        );
        if (tagMatches.length > 0) {
          score += Math.min(0.2, tagMatches.length * 0.05);
          reasons.push(`goal fit: ${tagMatches.slice(0, 2).join(", ")}`);
        }

        const matchingMuscles = workout.muscleGroups.filter((muscle) => hints.muscles.includes(muscle));
        if (matchingMuscles.length > 0) {
          score += Math.min(0.3, matchingMuscles.length * 0.1);
          reasons.push(`muscle focus: ${matchingMuscles.join(", ")}`);
        }

        if (isEquipmentCompatible(workout, availableEquipment)) {
          score += 0.15;
          reasons.push(workout.equipment.length === 0 ? "no equipment needed" : "matches available equipment");
        } else {
          score -= 0.2;
        }

        if (/knee|back|shoulder|injury|pain/.test(userQuery.toLowerCase())) {
          if (workout.category === "recovery" || workout.category === "flexibility") {
            score += 0.2;
            reasons.push("injury-aware option");
          }
        }

        if (/quick|10|15|20|min/.test(userQuery.toLowerCase()) && workout.durationMinutes <= 20) {
          score += 0.1;
          reasons.push("fits time limit");
        }

        return {
          workoutId: workout.id,
          matchScore: Math.max(0, Math.min(1, score)),
          matchReasons: reasons.length > 0 ? reasons : ["balanced recommendation"],
          modifications: [],
          warnings: [],
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return ranked;
  }

  async searchByGoal(
    userQuery: string,
    userProfile: UserProfile,
    preferences: Preferences,
    availableWorkouts: WorkoutTemplate[],
  ): Promise<AIWorkoutRecommendation[]> {
    const equipment = preferences.available_equipment ?? [];
    const candidateWorkouts = availableWorkouts.filter((workout) => isEquipmentCompatible(workout, equipment));

    const prompt = `
User profile:
- Name: ${userProfile.full_name}
- Experience: ${userProfile.experience_level}
- Goals: ${userProfile.goals.join(", ")}
- Equipment available: ${equipment.join(", ") || "none"}

User request:
${userQuery}

Candidate workouts:
${candidateWorkouts
  .map(
    (workout) =>
      `- ${workout.id} | ${workout.name} | ${workout.category} | ${workout.durationMinutes} min | equipment: ${workout.equipment.join(", ") || "none"} | goals: ${workout.goalTags.join(", ")} | anatomy: ${workout.anatomySummary}`,
  )
  .join("\n")}
`;

    const response = await this.generateWithCache<WorkoutRecommendationSchemaResponse>({
      feature: "workout_goal_search",
      userId: userProfile.id,
      prompt,
      systemInstruction: SYSTEM_INSTRUCTION,
      schema: workoutRecommendationSchema,
    });

    const structured = response.structuredData;
    if (structured?.recommendations?.length) {
      return structured.recommendations
        .map((item) => ({
          workoutId: item.workout_id,
          matchScore: item.match_score,
          matchReasons: item.match_reasons,
          modifications: item.modifications,
          warnings: item.warnings,
        }))
        .filter((item) => candidateWorkouts.some((workout) => workout.id === item.workoutId))
        .slice(0, 5);
    }

    return this.buildFallbackRecommendations(userQuery, preferences, candidateWorkouts);
  }

  async generateCustomWorkout(
    userQuery: string,
    userProfile: UserProfile,
    preferences: Preferences,
  ): Promise<CustomWorkoutPlan> {
    const pool = exerciseLibraryService
      .search(userQuery)
      .filter((exercise) => isEquipmentCompatible({ equipment: exercise.equipment } as WorkoutTemplate, preferences.available_equipment ?? []));

    const selected = pool.slice(0, 6);
    const durationMinutes = /10/.test(userQuery) ? 10 : /20/.test(userQuery) ? 20 : 30;

    return {
      name: "Mo Custom Session",
      description: `Custom plan generated from: ${userQuery}`,
      durationMinutes,
      exercises: selected.map((exercise, index) => ({
        exerciseName: exercise.name,
        sets: index < 2 ? 4 : 3,
        reps: exercise.category === "cardio" || exercise.category === "hiit" ? "30s" : "10-12",
        restSeconds: 45,
        modification: null,
        cue: `Control tempo and keep tension through each rep for ${exercise.name}.`,
      })),
    };
  }

  async getExerciseSwap(
    exercise: Exercise,
    reason: "too_easy" | "too_hard" | "equipment_missing" | "injury",
    userProfile: UserProfile,
  ): Promise<Exercise[]> {
    const pool = exerciseLibraryService
      .getAllExercises()
      .filter((candidate) => candidate.id !== exercise.id)
      .filter((candidate) => candidate.musclePrimary.some((muscle) => exercise.musclePrimary.includes(muscle)));

    const preferredDifficulty =
      reason === "too_easy"
        ? "advanced"
        : reason === "too_hard"
          ? "beginner"
          : (userProfile.experience_level ?? "beginner");

    const sorted = pool
      .sort((a, b) => Number(b.difficulty === preferredDifficulty) - Number(a.difficulty === preferredDifficulty))
      .slice(0, 4);

    return unique(sorted);
  }

  async analyzeFormFeedback(
    exerciseName: string,
    completedReps: number,
    completedSets: number,
    perceivedDifficulty: number,
    notes: string,
  ): Promise<FormFeedback> {
    const strengths = [
      completedSets >= 4 ? "Strong session consistency" : "Good work rate",
      perceivedDifficulty <= 3 ? "You maintained control and breathing" : "You pushed close to your current threshold",
    ];

    const corrections =
      notes.trim().length > 0
        ? ["Keep bracing before each rep", "Reduce speed on the lowering phase", `Watch note flagged: ${notes}`]
        : ["Keep bracing before each rep", "Reduce speed on the lowering phase"];

    return {
      summary: `${exerciseName}: ${completedSets} sets and ${completedReps} reps logged.`,
      strengths,
      corrections,
      nextSessionAdjustment:
        perceivedDifficulty >= 4
          ? "Repeat the same load and improve rep quality next session."
          : "Add a small load increase (2.5-5%) next session.",
    };
  }
}

const workoutAIService = new WorkoutAIService();

export default workoutAIService;
