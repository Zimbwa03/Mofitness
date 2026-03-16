import type {
  DailyMealPlan,
  DailyNutritionProgress,
  NutritionGoalDraft,
  NutritionTargets,
  PlannedMeal,
  Preferences,
  UserProfile,
} from '../../models';
import { normalizeDailyMealPlan, normalizePlannedMeal } from '../../utils/nutrition';
import offlineSyncService from '../OfflineSyncService';
import supabaseService from '../SupabaseService';

const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  active: 1.55,
  highly_active: 1.725,
};

const macroSplits: Record<string, { protein: number; carbs: number; fat: number }> = {
  gain_weight: { protein: 0.3, carbs: 0.45, fat: 0.25 },
  lose_weight: { protein: 0.35, carbs: 0.35, fat: 0.3 },
  maintain_weight: { protein: 0.3, carbs: 0.4, fat: 0.3 },
  build_muscle: { protein: 0.35, carbs: 0.4, fat: 0.25 },
  cut_fat: { protein: 0.4, carbs: 0.3, fat: 0.3 },
  athletic_performance: { protein: 0.3, carbs: 0.5, fat: 0.2 },
  general_health: { protein: 0.25, carbs: 0.45, fat: 0.3 },
  medical_dietary: { protein: 0.25, carbs: 0.4, fat: 0.35 },
};

const defaultCalorieAdjustments: Record<string, number> = {
  gain_weight: 250,
  lose_weight: -350,
  maintain_weight: 0,
  build_muscle: 220,
  cut_fat: -320,
  athletic_performance: 120,
  general_health: 0,
  medical_dietary: 0,
};

const warningMessages: Record<string, string> = {
  minor_requires_professional_guidance: 'Mo recommends conservative nutrition targets for minors and professional review before aggressive changes.',
  medical_condition_review: 'A recorded medical condition means this plan should stay conservative until a clinician or dietitian reviews it.',
  medical_dietary_goal_requires_clinician: 'Medical dietary goals should be reviewed with a clinician or dietitian before strict execution.',
  aggressive_weight_gain_rate: 'Mo recommends extending your deadline for a safer rate of weight gain.',
  aggressive_weight_loss_rate: 'Mo recommends extending your deadline for safer and more sustainable fat loss.',
};

interface GoalPreview {
  targets: NutritionTargets;
  daysToGoal: number;
  weeksToGoal: number;
  totalWeightDeltaKg: number;
  weeklyChangeKg: number;
  dailyCalorieDelta: number;
  safetyFlags: string[];
  warnings: string[];
  goalSummary: string;
  paceSummary: string;
  targetSummary: string;
  recommendedMealsPerDay: number;
  recommendationReason: string;
}

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) {
    return 30;
  }

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
}

function calculateBMR(profile: UserProfile) {
  const weight = Number(profile.weight_kg ?? 70);
  const height = Number(profile.height_cm ?? 170);
  const age = calculateAge(profile.date_of_birth);
  const sexOffset = profile.gender === 'male' ? 5 : -161;

  return 10 * weight + 6.25 * height - 5 * age + sexOffset;
}

function getDaysToGoal(targetDate: string) {
  return Math.max(1, Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86_400_000));
}

function getWeeklyWeightChange(currentWeight: number, targetWeight: number, daysToGoal: number) {
  return ((targetWeight - currentWeight) / daysToGoal) * 7;
}

function buildSafetyFlags(goalDraft: NutritionGoalDraft, profile: UserProfile) {
  const flags = new Set<string>();
  const age = calculateAge(profile.date_of_birth);
  const currentWeight = goalDraft.current_weight_kg || Number(profile.weight_kg ?? 70);
  const targetWeight = goalDraft.target_weight_kg ?? currentWeight;
  const daysToGoal = getDaysToGoal(goalDraft.target_date);
  const weeklyChange = getWeeklyWeightChange(currentWeight, targetWeight, daysToGoal);

  if (age < 18) {
    flags.add('minor_requires_professional_guidance');
  }

  if ((goalDraft.medical_conditions_snapshot || '').trim()) {
    flags.add('medical_condition_review');
  }

  if (goalDraft.goal_type === 'medical_dietary') {
    flags.add('medical_dietary_goal_requires_clinician');
  }

  if ((goalDraft.goal_type === 'gain_weight' || goalDraft.goal_type === 'build_muscle') && weeklyChange > 0.5) {
    flags.add('aggressive_weight_gain_rate');
  }

  if ((goalDraft.goal_type === 'lose_weight' || goalDraft.goal_type === 'cut_fat') && weeklyChange < -0.75) {
    flags.add('aggressive_weight_loss_rate');
  }

  return Array.from(flags);
}

function recommendMealsPerDay(goalType: NutritionGoalDraft['goal_type'], calorieTarget: number) {
  if (goalType === 'gain_weight' && calorieTarget >= 3200) {
    return {
      mealsPerDay: 5,
      reason: 'Higher calorie targets are easier to execute when food volume is spread across five meals.',
    };
  }

  if (goalType === 'build_muscle' || goalType === 'athletic_performance') {
    return {
      mealsPerDay: 4,
      reason: 'Four meals improves protein timing and keeps energy steadier around training.',
    };
  }

  if (goalType === 'lose_weight' || goalType === 'cut_fat') {
    return {
      mealsPerDay: 4,
      reason: 'Four meals helps control hunger while keeping protein intake distributed through the day.',
    };
  }

  if (goalType === 'medical_dietary') {
    return {
      mealsPerDay: 4,
      reason: 'Conservative meal spacing is easier to monitor and adjust when dietary guardrails matter.',
    };
  }

  return {
    mealsPerDay: 3,
    reason: 'Three meals is a practical baseline when calorie pressure is moderate.',
  };
}

class NutritionAIService {
  private async cacheGeneratedPlan(plan: DailyMealPlan) {
    const cachedPlans = await offlineSyncService.getCachedMealPlans();
    const merged = [plan, ...cachedPlans.filter((cachedPlan) => cachedPlan.id !== plan.id)];
    await offlineSyncService.cacheMealPlans(merged);
  }

  calculateDailyTargets(goalDraft: NutritionGoalDraft, profile: UserProfile, isWorkoutDay = false): NutritionTargets {
    const currentWeight = goalDraft.current_weight_kg || Number(profile.weight_kg ?? 70);
    const targetWeight = goalDraft.target_weight_kg ?? currentWeight;
    const daysToGoal = getDaysToGoal(goalDraft.target_date);
    const weeklyChange = getWeeklyWeightChange(currentWeight, targetWeight, daysToGoal);
    const hasExplicitWeightTarget = goalDraft.target_weight_kg !== null && Number.isFinite(goalDraft.target_weight_kg);
    const dailyCalorieDelta = hasExplicitWeightTarget
      ? (weeklyChange * 7700) / 7
      : defaultCalorieAdjustments[goalDraft.goal_type] ?? 0;
    const activityLevel = profile.activity_level ?? 'lightly_active';
    const tdee = calculateBMR(profile) * (activityMultipliers[activityLevel] ?? 1.375);
    const dailyCalorieTarget = Math.round(Math.min(Math.max(tdee + dailyCalorieDelta, 1200), 5000));
    const split = macroSplits[goalDraft.goal_type] ?? macroSplits.general_health;
    const waterBase = currentWeight * 0.035;

    return {
      dailyCalorieTarget,
      protein_g: Math.round((dailyCalorieTarget * split.protein) / 4),
      carbs_g: Math.round((dailyCalorieTarget * split.carbs) / 4),
      fat_g: Math.round((dailyCalorieTarget * split.fat) / 9),
      fiber_g: goalDraft.goal_type === 'lose_weight' || goalDraft.goal_type === 'cut_fat' ? 32 : 28,
      sodium_mg: 2300,
      water_min_liters: Number((waterBase + (isWorkoutDay ? 0.3 : 0)).toFixed(1)),
      water_max_liters: Number((waterBase + (isWorkoutDay ? 0.9 : 0.6)).toFixed(1)),
    };
  }

  buildGoalPreview(goalDraft: NutritionGoalDraft, profile: UserProfile): GoalPreview {
    const currentWeight = goalDraft.current_weight_kg || Number(profile.weight_kg ?? 70);
    const targetWeight = goalDraft.target_weight_kg ?? currentWeight;
    const daysToGoal = getDaysToGoal(goalDraft.target_date);
    const weeksToGoal = Number((daysToGoal / 7).toFixed(1));
    const totalWeightDeltaKg = Number((targetWeight - currentWeight).toFixed(1));
    const weeklyChangeKg = Number(getWeeklyWeightChange(currentWeight, targetWeight, daysToGoal).toFixed(2));
    const targets = this.calculateDailyTargets(goalDraft, profile);
    const tdee = calculateBMR(profile) * (activityMultipliers[profile.activity_level ?? 'lightly_active'] ?? 1.375);
    const dailyCalorieDelta = Math.round(targets.dailyCalorieTarget - tdee);
    const safetyFlags = buildSafetyFlags(goalDraft, profile);
    const warnings = safetyFlags.map((flag) => warningMessages[flag]).filter(Boolean);
    const recommendation = recommendMealsPerDay(goalDraft.goal_type, targets.dailyCalorieTarget);

    const targetSummary =
      goalDraft.goal_type === 'build_muscle' && goalDraft.target_muscle_mass_kg
        ? `Target muscle mass: ${goalDraft.target_muscle_mass_kg.toFixed(1)} kg`
        : goalDraft.goal_type === 'cut_fat' && goalDraft.target_body_fat_pct
          ? `Target body fat: ${goalDraft.target_body_fat_pct.toFixed(1)}%`
          : goalDraft.target_weight_kg
            ? `${currentWeight.toFixed(1)} kg to ${goalDraft.target_weight_kg.toFixed(1)} kg`
            : `${currentWeight.toFixed(1)} kg baseline`;

    const paceSummary = totalWeightDeltaKg !== 0
      ? `${totalWeightDeltaKg > 0 ? '+' : ''}${totalWeightDeltaKg.toFixed(1)} kg over ${daysToGoal} days (${weeklyChangeKg > 0 ? '+' : ''}${weeklyChangeKg.toFixed(2)} kg/week)`
      : `${daysToGoal} day horizon with macro timing focused on ${goalDraft.goal_type.replaceAll('_', ' ')}.`;

    const goalSummary = `${daysToGoal} days to target. ${dailyCalorieDelta >= 0 ? 'Daily surplus' : 'Daily deficit'} ${Math.abs(dailyCalorieDelta)} kcal. Estimated protein ${targets.protein_g}g.`;

    return {
      targets,
      daysToGoal,
      weeksToGoal,
      totalWeightDeltaKg,
      weeklyChangeKg,
      dailyCalorieDelta,
      safetyFlags,
      warnings,
      goalSummary,
      paceSummary,
      targetSummary,
      recommendedMealsPerDay: recommendation.mealsPerDay,
      recommendationReason: recommendation.reason,
    };
  }

  buildGoalPayload(goalDraft: NutritionGoalDraft, profile: UserProfile, preferences: Preferences) {
    const preview = this.buildGoalPreview(goalDraft, profile);
    const targets = preview.targets;
    return {
      ...goalDraft,
      daily_calorie_target: targets.dailyCalorieTarget,
      protein_target_g: targets.protein_g,
      carbs_target_g: targets.carbs_g,
      fat_target_g: targets.fat_g,
      fiber_target_g: targets.fiber_g,
      sodium_target_mg: targets.sodium_mg,
      water_target_min_liters: targets.water_min_liters,
      water_target_max_liters: targets.water_max_liters,
      goal_summary: preview.goalSummary,
      safety_flags: preview.safetyFlags,
      is_active: true,
      allergies_snapshot: goalDraft.allergies_snapshot.length ? goalDraft.allergies_snapshot : preferences.allergies,
      dietary_restrictions_snapshot: goalDraft.dietary_restrictions_snapshot.length
        ? goalDraft.dietary_restrictions_snapshot
        : preferences.dietary_restrictions,
      medical_conditions_snapshot: goalDraft.medical_conditions_snapshot || preferences.medical_conditions,
      cuisine_preference: goalDraft.cuisine_preference.length ? goalDraft.cuisine_preference : preferences.cuisine_preferences,
    };
  }

  async generateDailyMealPlan(planDate: string, goalId?: string) {
    const data = await supabaseService.invokeFunction<DailyMealPlan>('nutrition-plan', {
      action: 'generate',
      planDate,
      goalId,
    });

    const normalized = normalizeDailyMealPlan(data);
    if (normalized) {
      await this.cacheGeneratedPlan(normalized);
    }

    return normalized;
  }

  async adjustRemainingMeals(params: {
    remainingMealSlots: string[];
    consumedCalories: number;
    consumedProtein: number;
    consumedCarbs: number;
    consumedFat: number;
  }) {
    const data = await supabaseService.invokeFunction<{ meals: PlannedMeal[] }>('nutrition-plan', {
      action: 'adjust_remaining',
      ...params,
    });

    const meals = data?.meals ?? [];
    return meals.map((meal, index) => normalizePlannedMeal(meal, index, meals.length));
  }

  getDailyNutritionCoaching(progress: DailyNutritionProgress, targets: NutritionTargets) {
    const caloriePct = progress.calories / Math.max(1, targets.dailyCalorieTarget);
    if (caloriePct < 0.45) {
      return 'You are behind on energy intake for the day. Prioritize the next planned meal instead of grazing randomly.';
    }

    if (progress.protein_g < targets.protein_g * 0.6) {
      return 'Protein is trending low today. Keep the next meal protein-first so the day stays aligned with your goal.';
    }

    if (progress.water_liters < targets.water_min_liters * 0.5) {
      return 'Hydration is lagging. Add water before the next meal to avoid chasing the target too late.';
    }

    return 'You are tracking close to target. Stay consistent with meal timing and hydration through the rest of the day.';
  }
}

const nutritionAIService = new NutritionAIService();

export default nutritionAIService;
