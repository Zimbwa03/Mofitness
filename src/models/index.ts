import type { Session, User } from "@supabase/supabase-js";

export * from "./nutrition";
export * from "./run";

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type ActivityLevel = "sedentary" | "lightly_active" | "active" | "highly_active";
export type PreferredWorkoutTime = "morning" | "afternoon" | "evening";
export type ActivityType = "strength" | "cardio" | "flexibility" | "mixed";

export interface UserGoals {
  values: string[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  gender: Gender | null;
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  body_fat_pct: number | null;
  experience_level: ExperienceLevel;
  goals: string[];
  activity_level: ActivityLevel | null;
  points?: number;
  push_token?: string | null;
  notifications_enabled?: boolean;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PersonalDetailsInput {
  full_name: string;
  email: string;
  gender: Gender | null;
  date_of_birth: string | null;
}

export interface Preferences {
  id?: string;
  user_id?: string;
  training_days_per_week: number | null;
  available_equipment: string[];
  preferred_workout_time: PreferredWorkoutTime | null;
  dietary_restrictions: string[];
  country_code: string | null;
  allergies: string[];
  cuisine_preferences: string[];
  medical_conditions: string;
  activity_type: ActivityType | null;
  sport_focus: string;
  interest_in_mindfulness: boolean;
  wants_challenges: boolean;
  has_wearable: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  preferences: Preferences;
  loading: boolean;
  isOnboardingComplete: boolean;
  hydrateSession: () => Promise<void>;
  syncSession: (session: Session | null) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: "google" | "apple") => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setProfile: (profile: Partial<UserProfile>) => void;
  setPreferences: (preferences: Partial<Preferences>) => void;
  completeOnboarding: () => Promise<void>;
  setOnboardingComplete: (value: boolean) => void;
}

export interface WorkoutPlanItem {
  id: string;
  title: string;
  category: string;
  scheduled_date: string;
  duration_minutes: number;
  completed: boolean;
}

export interface Workout {
  id: string;
  name: string;
  category: string;
  description: string | null;
  duration_minutes: number | null;
  equipment_required: string[];
  calories_estimate: number | null;
  difficulty: ExperienceLevel | null;
  sport_tag: string | null;
  video_url: string | null;
}

export interface UserWorkout {
  id: string;
  user_id: string;
  workout_id: string;
  scheduled_date: string | null;
  completed_date: string | null;
  reps: Record<string, number[]> | null;
  weight_used: Record<string, number[]> | null;
  rating: number | null;
  perceived_difficulty: number | null;
  calories_burned: number | null;
  notes: string | null;
}

export interface MealDish {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealPlanDay {
  id: string;
  date: string;
  meals: Array<{
    meal: string;
    dishes: MealDish[];
  }>;
  total_calories: number;
}

export interface MealSuggestion {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface WellnessSnapshot {
  sleep_hours: number | null;
  water_liters: number | null;
  stress_level: number | null;
  mood: string | null;
}

export interface WellnessLog {
  id: string;
  user_id: string;
  date: string;
  sleep_hours: number | null;
  water_liters: number | null;
  stress_level: number | null;
  mood: string | null;
  notes: string | null;
}

export interface WellnessRecommendation {
  overtraining_risk: "low" | "medium" | "high";
  sleep_recommendation_hours: number;
  hydration_recommendation_liters: number;
  stress_tips: string[];
  suggested_activities: string[];
  alert_message: string | null;
}

export interface WellnessTip {
  id: string;
  title: string;
  description: string;
}

export interface ChallengeSummary {
  id: string;
  title: string;
  progress_metric: number;
  rank: number | null;
}

export interface RewardCatalogItem {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  active: boolean;
}

export interface UserReward {
  id: string;
  reward_id: string;
  user_id: string;
  redeemed_at: string;
  status: "redeemed" | "fulfilled";
}

export interface AchievementBadge {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon_name: string;
  points_threshold: number | null;
  created_at?: string;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  user_id: string;
  awarded_at: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  subtitle: string;
  type: "workout" | "meal" | "wellness";
}

export interface AIUsageLogInput {
  user_id: string | null;
  feature: string;
  input_tokens: number | null;
  output_tokens: number | null;
  model: string;
}

export interface VertexUsageMetadata {
  inputTokens: number | null;
  outputTokens: number | null;
  model: string;
}

export interface VertexStructuredResponse<T> {
  text: string;
  structuredData: T | null;
  usage: VertexUsageMetadata;
  source: "vertex" | "cache";
}
