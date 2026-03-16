import type { MealAnalysisResult, MealLog, MealLogMethod, MealSlot, PlannedDish } from '../models';

export interface MealLogDraftInput {
  id?: string;
  planId?: string | null;
  mealSlot: MealSlot;
  logDate: string;
  logMethod: MealLogMethod;
  mealName?: string | null;
  dishes: PlannedDish[];
  description?: string | null;
  photoUrl?: string | null;
  photoStoragePath?: string | null;
  analysis?: MealAnalysisResult | null;
}

export function buildMealLogPayload(userId: string, input: MealLogDraftInput) {
  const totals = input.dishes.reduce(
    (acc, dish) => ({
      calories: acc.calories + dish.calories,
      protein: Number((acc.protein + dish.protein_g).toFixed(1)),
      carbs: Number((acc.carbs + dish.carbs_g).toFixed(1)),
      fat: Number((acc.fat + dish.fat_g).toFixed(1)),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return {
    id: input.id,
    user_id: userId,
    plan_id: input.planId ?? null,
    meal_slot: input.mealSlot,
    log_date: input.logDate,
    log_method: input.logMethod,
    meal_name: input.mealName ?? null,
    dishes: input.dishes,
    total_calories: totals.calories,
    total_protein_g: totals.protein,
    total_carbs_g: totals.carbs,
    total_fat_g: totals.fat,
    description: input.description ?? null,
    photo_url: input.photoUrl ?? null,
    photo_storage_path: input.photoStoragePath ?? null,
    ai_accuracy_score: input.analysis?.accuracy_score ?? null,
    ai_confidence: input.analysis?.confidence ?? null,
    ai_analysis: input.analysis ?? null,
    ai_identified_dishes: input.analysis?.identified_dishes ?? null,
    feed_eligible: Boolean(input.analysis?.feed_eligible && (input.analysis?.confidence ?? 0) >= 60),
  };
}

export function buildOptimisticMealLog(
  userId: string,
  input: MealLogDraftInput,
  options?: {
    queuedJobId?: string | null;
    photoUrl?: string | null;
    photoStoragePath?: string | null;
  },
): MealLog {
  const payload = buildMealLogPayload(userId, {
    ...input,
    photoUrl: options?.photoUrl ?? input.photoUrl ?? null,
    photoStoragePath: options?.photoStoragePath ?? input.photoStoragePath ?? null,
  });
  const now = new Date().toISOString();

  return {
    id: input.id ?? `offline-log-${Date.now()}`,
    user_id: userId,
    plan_id: payload.plan_id,
    meal_slot: payload.meal_slot,
    logged_at: now,
    log_date: payload.log_date,
    log_method: payload.log_method,
    meal_name: payload.meal_name,
    dishes: payload.dishes,
    total_calories: payload.total_calories,
    total_protein_g: payload.total_protein_g,
    total_carbs_g: payload.total_carbs_g,
    total_fat_g: payload.total_fat_g,
    description: payload.description,
    photo_url: payload.photo_url,
    photo_storage_path: payload.photo_storage_path,
    ai_accuracy_score: payload.ai_accuracy_score,
    ai_confidence: payload.ai_confidence,
    ai_analysis: payload.ai_analysis,
    ai_identified_dishes: payload.ai_identified_dishes,
    feed_eligible: payload.feed_eligible,
    posted_to_feed: false,
    feed_post_id: null,
    pending_sync: true,
    queued_job_id: options?.queuedJobId ?? null,
    created_at: now,
    updated_at: now,
  };
}
