export type NutritionGoalType =
  | 'gain_weight'
  | 'lose_weight'
  | 'maintain_weight'
  | 'build_muscle'
  | 'cut_fat'
  | 'athletic_performance'
  | 'general_health'
  | 'medical_dietary';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack_1' | 'snack_2' | 'snack_3';
export type MealLogMethod = 'photo' | 'manual' | 'ai_suggested';
export type FeedAudience = 'everyone' | 'fitness_community' | 'following';

export interface NutritionGoal {
  id: string;
  user_id: string;
  goal_type: NutritionGoalType;
  target_weight_kg: number | null;
  current_weight_kg: number;
  target_body_fat_pct: number | null;
  target_muscle_mass_kg: number | null;
  target_date: string;
  daily_calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  fiber_target_g: number;
  sodium_target_mg: number;
  water_target_min_liters: number;
  water_target_max_liters: number;
  meals_per_day: number;
  country_code: string;
  cuisine_preference: string[];
  allergies_snapshot: string[];
  dietary_restrictions_snapshot: string[];
  medical_conditions_snapshot: string;
  goal_summary: string | null;
  safety_flags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CountryCuisine {
  country_code: string;
  country_name: string;
  cuisine_tags: string[];
  staples: string[];
  proteins: string[];
  carbs: string[];
  vegetables: string[];
}

export interface RegionalFood {
  id: string;
  name: string;
  local_name: string | null;
  country_codes: string[];
  calories_per_100g: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  iron_mg: number | null;
  calcium_mg: number | null;
  sodium_mg: number | null;
  category: string;
}

export interface PlannedDish {
  name: string;
  local_name: string | null;
  quantity_g: number;
  quantity_display: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg?: number;
  cooking_method: string;
  nutritional_benefit: string;
}

export interface ShoppingItem {
  item: string;
  quantity: string;
  notes: string | null;
}

export interface PlannedMeal {
  slot: MealSlot;
  local_name: string;
  english_name: string;
  suggested_time: string;
  prep_time_minutes: number;
  difficulty: 'easy' | 'medium' | 'complex';
  why_this_meal: string;
  pre_meal_action: string;
  post_meal_action: string;
  workout_relation: 'pre_workout' | 'post_workout' | null | string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  dishes: PlannedDish[];
  ingredients_shopping: ShoppingItem[];
  image_generation_prompt: string;
}

export interface WaterScheduleItem {
  time: string;
  amount_ml: number;
  reason: string;
}

export interface DailyMealPlan {
  id: string;
  user_id: string;
  goal_id: string;
  plan_date: string;
  day_number: number;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number | null;
  total_sodium_mg: number | null;
  water_target_liters: number;
  water_schedule: WaterScheduleItem[];
  meals: PlannedMeal[];
  ai_notes: string | null;
  workout_day: boolean;
  generated_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealAnalysisDish {
  name: string;
  quantity_est: string;
  calories_est: number;
  protein_g_est: number;
  carbs_g_est: number;
  fat_g_est: number;
  confidence: 'high' | 'medium' | 'low' | string;
}

export interface MealAnalysisResult {
  identified_dishes: MealAnalysisDish[];
  total_calories_est: number;
  total_protein_g_est: number;
  total_carbs_g_est: number;
  total_fat_g_est: number;
  accuracy_score: number;
  confidence: number;
  accuracy_breakdown: {
    dish_match_score: number;
    portion_score: number;
    macro_score: number;
    ingredient_score: number;
  };
  matched_items: string[];
  missing_items: string[];
  extra_items: string[];
  feedback: string;
  feed_eligible: boolean;
  feed_eligibility_reason: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  plan_id: string | null;
  meal_slot: MealSlot;
  logged_at: string;
  log_date: string;
  log_method: MealLogMethod;
  meal_name: string | null;
  dishes: PlannedDish[];
  total_calories: number | null;
  total_protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  description: string | null;
  photo_url: string | null;
  photo_storage_path: string | null;
  ai_accuracy_score: number | null;
  ai_confidence: number | null;
  ai_analysis: MealAnalysisResult | null;
  ai_identified_dishes: MealAnalysisDish[] | null;
  feed_eligible: boolean;
  posted_to_feed: boolean;
  feed_post_id: string | null;
  pending_sync?: boolean;
  queued_job_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BodyMetricLog {
  id: string;
  user_id: string;
  log_date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  muscle_mass_kg: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  logged_at: string;
  amount_ml: number;
  log_date: string;
  created_at: string;
}

export interface FeedPost {
  id: string;
  user_id: string;
  meal_log_id: string;
  caption: string | null;
  audience: FeedAudience;
  show_stats_card: boolean;
  public_photo_url: string;
  public_photo_path: string | null;
  meal_name: string;
  total_calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  ai_accuracy_score: number | null;
  confidence_score: number | null;
  country_code: string | null;
  cuisine_tag: string | null;
  goal_tag: string | null;
  likes_count: number;
  comments_count: number;
  rating_avg: number;
  rating_count: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeedComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  pending_sync?: boolean;
  queued_job_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedRating {
  user_id: string;
  post_id: string;
  rating: number;
  rated_at: string;
}

export interface FeedActivityItem {
  id: string;
  type: 'like' | 'comment';
  actor_name: string;
  post_id: string;
  post_name: string;
  body: string | null;
  created_at: string;
}

export interface NutritionTargets {
  dailyCalorieTarget: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  water_min_liters: number;
  water_max_liters: number;
}

export interface DailyNutritionProgress {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_liters: number;
}

export interface FeedPublishInput {
  mealLogId: string;
  caption?: string;
  audience?: FeedAudience;
  showStatsCard?: boolean;
}

export interface NutritionGoalDraft {
  goal_type: NutritionGoalType;
  target_weight_kg: number | null;
  current_weight_kg: number;
  target_body_fat_pct: number | null;
  target_muscle_mass_kg: number | null;
  target_date: string;
  meals_per_day: number;
  country_code: string;
  cuisine_preference: string[];
  allergies_snapshot: string[];
  dietary_restrictions_snapshot: string[];
  medical_conditions_snapshot: string;
}
