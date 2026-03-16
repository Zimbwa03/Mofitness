import type { ExperienceLevel, Preferences, UserProfile } from "./index";

export type WorkoutCategory =
  | "strength"
  | "cardio"
  | "hiit"
  | "flexibility"
  | "recovery"
  | "core"
  | "sport";

export type WorkoutDifficulty = ExperienceLevel;

export type WorkoutFormat =
  | "sets_reps"
  | "timed"
  | "amrap"
  | "emom"
  | "tabata"
  | "circuit"
  | "superset"
  | "drop_set"
  | "for_time"
  | "running";

export type WorkoutFilterSource = "my_plan" | "ai_recommended" | "all_workouts" | "saved";

export type WorkoutSortBy =
  | "recommended"
  | "newest"
  | "duration_asc"
  | "duration_desc"
  | "calories_desc"
  | "rating_desc"
  | "most_done";

export interface WorkoutFilters {
  source: WorkoutFilterSource[];
  muscle_group: (
    | "chest"
    | "back"
    | "shoulders"
    | "arms"
    | "core"
    | "quads"
    | "hamstrings"
    | "glutes"
    | "calves"
    | "full_body"
  )[];
  category: WorkoutCategory[];
  difficulty: WorkoutDifficulty[];
  duration_range: [number, number];
  equipment: string[];
  bodyweight_only: boolean;
  format: WorkoutFormat[];
  sort_by: WorkoutSortBy;
}

export const DEFAULT_WORKOUT_FILTERS: WorkoutFilters = {
  source: ["all_workouts"],
  muscle_group: [],
  category: [],
  difficulty: [],
  duration_range: [5, 90],
  equipment: [],
  bodyweight_only: false,
  format: [],
  sort_by: "recommended",
};

export interface Exercise {
  id: string;
  name: string;
  isVariant: boolean;
  category: WorkoutCategory;
  musclePrimary: string[];
  muscleSecondary: string[];
  equipment: string[];
  difficulty: WorkoutDifficulty;
  animationKey: string;
  met: number;
  coachingCues: string[];
  description: string;
  movementPattern: string;
  anatomyFocus: string;
  benefits: string[];
  setImpact: string;
  medicalConsiderations: string[];
  progressions: string[];
  regressions: string[];
  motivationQuote: string;
  goalTags: string[];
}

export interface WorkoutExerciseTemplate {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
  order: number;
  animationKey: string;
  cue?: string;
  modification?: string;
  suggestedLoad?: string;
  stimulusNote?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkoutCategory;
  format: WorkoutFormat;
  difficulty: WorkoutDifficulty;
  durationMinutes: number;
  caloriesEstimate: number;
  muscleGroups: string[];
  equipment: string[];
  exercises: WorkoutExerciseTemplate[];
  rating: number;
  timesCompleted: number;
  createdAt: string;
  anatomySummary: string;
  intensitySummary: string;
  benefits: string[];
  medicalConsiderations: string[];
  coachNotes: string[];
  recoveryNotes: string[];
  motivationQuote: string;
  goalTags: string[];
  isFeatured?: boolean;
  isSaved?: boolean;
}

export interface WeeklyWorkoutSlot {
  dateISO: string;
  dayLabel: string;
  workoutCategory: WorkoutCategory | "rest";
  workoutId?: string;
  isToday: boolean;
  completed: boolean;
}

export interface SetData {
  repsCompleted: number;
  weightKg: number;
  restSeconds: number;
  perceivedDifficulty?: number;
  notes?: string;
}

export interface CompletedSet {
  exerciseId: string;
  exerciseName: string;
  exerciseIndex: number;
  setIndex: number;
  repsCompleted: number;
  weightKg: number;
  restSeconds: number;
  loggedAt: string;
  perceivedDifficulty?: number;
  notes?: string;
}

export interface WorkoutSession {
  sessionId: string;
  workout: WorkoutTemplate;
  startedAt: string;
  isCompleted: boolean;
}

export interface WorkoutSummary {
  sessionId: string;
  workoutId: string;
  workoutName: string;
  durationSeconds: number;
  exercisesCompleted: number;
  setsCompleted: number;
  volumeKg: number;
  estimatedCalories: number;
  completedAt: string;
  personalBests: string[];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  durationMs: number;
  uri: string;
}

export interface AIWorkoutRecommendation {
  workoutId: string;
  matchScore: number;
  matchReasons: string[];
  modifications: string[];
  warnings: string[];
}

export interface CustomWorkoutPlan {
  name: string;
  description: string;
  durationMinutes: number;
  exercises: Array<{
    exerciseName: string;
    sets: number;
    reps: string;
    restSeconds: number;
    modification: string | null;
    cue: string;
  }>;
}

export interface FormFeedback {
  summary: string;
  strengths: string[];
  corrections: string[];
  nextSessionAdjustment: string;
}

export interface WorkoutAISearchContext {
  userQuery: string;
  userProfile: UserProfile;
  preferences: Preferences;
  availableWorkouts: WorkoutTemplate[];
}
