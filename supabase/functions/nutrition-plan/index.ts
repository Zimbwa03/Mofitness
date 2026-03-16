import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  buildFallbackMealPlan,
  buildRemainingMeals,
  buildSafetyFlags,
  calculateDailyTargets,
  type CountryCuisineRow,
  type DailyMealPlan,
  type NutritionGoalRow,
  type PlannedMeal,
  type PreferencesRow,
  type RegionalFoodRow,
  type UserProfileRow,
} from '../_shared/nutrition.ts';
import { createFunctionContext } from '../_shared/supabase.ts';
import { generateStructuredContent, isVertexConfigured } from '../_shared/vertex.ts';

interface GeneratePlanRequest {
  action?: 'generate' | 'adjust_remaining';
  planDate?: string;
  goalId?: string;
  remainingMealSlots?: string[];
  consumedCalories?: number;
  consumedProtein?: number;
  consumedCarbs?: number;
  consumedFat?: number;
}

function buildPlanPrompt(args: {
  profile: UserProfileRow;
  preferences: PreferencesRow;
  goal: NutritionGoalRow;
  countryCuisine: CountryCuisineRow | null;
  foods: RegionalFoodRow[];
  previousMeals: string[];
  planDate: string;
  dayNumber: number;
  isWorkoutDay: boolean;
}) {
  const { profile, preferences, goal, countryCuisine, foods, previousMeals, planDate, dayNumber, isWorkoutDay } = args;
  const foodSummary = foods.slice(0, 20).map((food) => `${food.name} (${food.category})`).join(', ');
  const safetyFlags = buildSafetyFlags(
    profile,
    goal.goal_type,
    goal.current_weight_kg,
    goal.target_weight_kg,
    goal.target_date,
    goal.medical_conditions_snapshot || preferences.medical_conditions,
  );

  return `Generate a valid JSON nutrition plan for ${planDate}.
User: ${profile.full_name}, gender=${profile.gender ?? 'unknown'}, age=${profile.date_of_birth ?? 'unknown'}.
Goal type: ${goal.goal_type}.
Daily targets: ${goal.daily_calorie_target} kcal, ${goal.protein_target_g}g protein, ${goal.carbs_target_g}g carbs, ${goal.fat_target_g}g fat, ${goal.fiber_target_g}g fiber.
Hydration range: ${goal.water_target_min_liters}-${goal.water_target_max_liters} L.
Country: ${countryCuisine?.country_name ?? goal.country_code}.
Cuisine preferences: ${(goal.cuisine_preference ?? []).join(', ') || (preferences.cuisine_preferences ?? []).join(', ') || 'local foods'}.
Restrictions: ${(goal.dietary_restrictions_snapshot ?? []).join(', ') || (preferences.dietary_restrictions ?? []).join(', ') || 'none'}.
Allergies: ${(goal.allergies_snapshot ?? []).join(', ') || (preferences.allergies ?? []).join(', ') || 'none'}.
Medical conditions: ${goal.medical_conditions_snapshot || preferences.medical_conditions || 'none'}.
Safety flags: ${safetyFlags.join(', ') || 'none'}.
Workout day: ${isWorkoutDay ? 'yes' : 'no'}.
Meals per day: ${goal.meals_per_day}. Day number: ${dayNumber}.
Avoid repeating: ${previousMeals.join(', ') || 'none'}.
Use foods from: ${foodSummary}.
Return JSON with fields plan_date, day_number, ai_daily_note, total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g, total_sodium_mg, water_target_liters, water_schedule[], meals[]. Each meal must include slot, local_name, english_name, suggested_time, prep_time_minutes, difficulty, why_this_meal, pre_meal_action, post_meal_action, workout_relation, calories, protein_g, carbs_g, fat_g, fiber_g, sodium_mg, dishes[], ingredients_shopping[], image_generation_prompt.`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeGeneratedPlan(candidate: unknown, fallbackPlan: DailyMealPlan): DailyMealPlan {
  const rawPlan = isRecord(candidate) ? candidate : {};
  const rawMeals = Array.isArray(rawPlan.meals) ? rawPlan.meals : [];

  const meals: PlannedMeal[] = fallbackPlan.meals.map((fallbackMeal, index) => {
    const rawMeal = isRecord(rawMeals[index]) ? rawMeals[index] : {};
    return {
      ...fallbackMeal,
      ...rawMeal,
      slot: typeof rawMeal.slot === 'string' && rawMeal.slot.trim() ? rawMeal.slot : fallbackMeal.slot,
      local_name: typeof rawMeal.local_name === 'string' && rawMeal.local_name.trim() ? rawMeal.local_name : fallbackMeal.local_name,
      english_name: typeof rawMeal.english_name === 'string' && rawMeal.english_name.trim() ? rawMeal.english_name : fallbackMeal.english_name,
      suggested_time: typeof rawMeal.suggested_time === 'string' && rawMeal.suggested_time.trim() ? rawMeal.suggested_time : fallbackMeal.suggested_time,
      why_this_meal: typeof rawMeal.why_this_meal === 'string' && rawMeal.why_this_meal.trim() ? rawMeal.why_this_meal : fallbackMeal.why_this_meal,
      pre_meal_action: typeof rawMeal.pre_meal_action === 'string' && rawMeal.pre_meal_action.trim() ? rawMeal.pre_meal_action : fallbackMeal.pre_meal_action,
      post_meal_action: typeof rawMeal.post_meal_action === 'string' && rawMeal.post_meal_action.trim() ? rawMeal.post_meal_action : fallbackMeal.post_meal_action,
      dishes: Array.isArray(rawMeal.dishes) && rawMeal.dishes.length ? rawMeal.dishes : fallbackMeal.dishes,
      ingredients_shopping: Array.isArray(rawMeal.ingredients_shopping) && rawMeal.ingredients_shopping.length
        ? rawMeal.ingredients_shopping
        : fallbackMeal.ingredients_shopping,
      image_generation_prompt: typeof rawMeal.image_generation_prompt === 'string' && rawMeal.image_generation_prompt.trim()
        ? rawMeal.image_generation_prompt
        : fallbackMeal.image_generation_prompt,
    };
  });

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + Number(meal.calories ?? 0),
      protein: Number((acc.protein + Number(meal.protein_g ?? 0)).toFixed(1)),
      carbs: Number((acc.carbs + Number(meal.carbs_g ?? 0)).toFixed(1)),
      fat: Number((acc.fat + Number(meal.fat_g ?? 0)).toFixed(1)),
      fiber: Number((acc.fiber + Number(meal.fiber_g ?? 0)).toFixed(1)),
      sodium: acc.sodium + Number(meal.sodium_mg ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
  );

  return {
    ...fallbackPlan,
    ...rawPlan,
    plan_date: typeof rawPlan.plan_date === 'string' && rawPlan.plan_date.trim() ? rawPlan.plan_date : fallbackPlan.plan_date,
    day_number: typeof rawPlan.day_number === 'number' ? rawPlan.day_number : fallbackPlan.day_number,
    ai_daily_note: typeof rawPlan.ai_daily_note === 'string' && rawPlan.ai_daily_note.trim() ? rawPlan.ai_daily_note : fallbackPlan.ai_daily_note,
    total_calories: typeof rawPlan.total_calories === 'number' ? rawPlan.total_calories : totals.calories,
    total_protein_g: typeof rawPlan.total_protein_g === 'number' ? rawPlan.total_protein_g : totals.protein,
    total_carbs_g: typeof rawPlan.total_carbs_g === 'number' ? rawPlan.total_carbs_g : totals.carbs,
    total_fat_g: typeof rawPlan.total_fat_g === 'number' ? rawPlan.total_fat_g : totals.fat,
    total_fiber_g: typeof rawPlan.total_fiber_g === 'number' ? rawPlan.total_fiber_g : totals.fiber,
    total_sodium_mg: typeof rawPlan.total_sodium_mg === 'number' ? rawPlan.total_sodium_mg : totals.sodium,
    water_target_liters: typeof rawPlan.water_target_liters === 'number' ? rawPlan.water_target_liters : fallbackPlan.water_target_liters,
    water_schedule: Array.isArray(rawPlan.water_schedule) && rawPlan.water_schedule.length ? rawPlan.water_schedule : fallbackPlan.water_schedule,
    meals,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { admin, userId } = await createFunctionContext(req);
    const body = (await req.json().catch(() => ({}))) as GeneratePlanRequest;
    const action = body.action ?? 'generate';

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('id, full_name, gender, date_of_birth, height_cm, weight_kg, activity_level')
      .eq('id', userId)
      .single<UserProfileRow>();

    const { data: preferences, error: preferencesError } = await admin
      .from('preferences')
      .select('dietary_restrictions, medical_conditions, country_code, allergies, cuisine_preferences')
      .eq('user_id', userId)
      .single<PreferencesRow>();

    if (profileError || !profile || preferencesError || !preferences) {
      throw new Error('Unable to load nutrition profile data');
    }

    const planDate = body.planDate ?? new Date().toISOString().slice(0, 10);

    const goalQuery = admin
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    const { data: activeGoalRows, error: goalError } = body.goalId
      ? await admin.from('nutrition_goals').select('*').eq('user_id', userId).eq('id', body.goalId)
      : await goalQuery;

    if (goalError || !activeGoalRows || activeGoalRows.length === 0) {
      throw new Error('No active nutrition goal found');
    }

    const goal = activeGoalRows[0] as NutritionGoalRow;

    if (action === 'adjust_remaining') {
      const [{ data: countryCuisine }, { data: foods }] = await Promise.all([
        admin.from('country_cuisines').select('*').eq('country_code', goal.country_code).maybeSingle<CountryCuisineRow>(),
        admin.from('regional_foods').select('*').order('name', { ascending: true }).returns<RegionalFoodRow[]>(),
      ]);

      const remainingMeals = buildRemainingMeals({
        goal,
        countryCuisine: countryCuisine ?? null,
        foods: foods ?? [],
        remainingMealSlots: body.remainingMealSlots ?? ['dinner'],
        consumedCalories: Number(body.consumedCalories ?? 0),
        consumedProtein: Number(body.consumedProtein ?? 0),
        consumedCarbs: Number(body.consumedCarbs ?? 0),
        consumedFat: Number(body.consumedFat ?? 0),
      });

      return jsonResponse({ meals: remainingMeals });
    }

    const { data: existingPlan } = await admin
      .from('daily_meal_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', planDate)
      .maybeSingle();

    if (existingPlan) {
      return jsonResponse(existingPlan);
    }

    const [{ data: countRows }, { data: workoutRows }, { data: previousPlanRows }, { data: countryCuisine }, { data: foods }] = await Promise.all([
      admin.from('daily_meal_plans').select('id', { count: 'exact' }).eq('goal_id', goal.id).lt('plan_date', planDate),
      admin.from('user_workouts').select('id').eq('user_id', userId).eq('scheduled_date', planDate),
      admin.from('daily_meal_plans').select('meals').eq('user_id', userId).lt('plan_date', planDate).order('plan_date', { ascending: false }).limit(3),
      admin.from('country_cuisines').select('*').eq('country_code', goal.country_code).maybeSingle<CountryCuisineRow>(),
      admin.from('regional_foods').select('*').order('name', { ascending: true }).returns<RegionalFoodRow[]>(),
    ]);

    const previousMeals = (previousPlanRows ?? []).flatMap((row: { meals?: Array<{ english_name?: string; local_name?: string }> }) =>
      (row.meals ?? []).flatMap((meal) => [meal.english_name, meal.local_name].filter(Boolean) as string[]),
    );
    const dayNumber = (countRows?.length ?? 0) + 1;
    const isWorkoutDay = (workoutRows?.length ?? 0) > 0;

    const computedTargets = calculateDailyTargets(
      profile,
      goal.goal_type,
      goal.current_weight_kg,
      goal.target_weight_kg,
      goal.target_date,
      isWorkoutDay,
    );

    const hydratedGoal: NutritionGoalRow = {
      ...goal,
      daily_calorie_target: goal.daily_calorie_target || computedTargets.dailyCalorieTarget,
      protein_target_g: goal.protein_target_g || computedTargets.protein_g,
      carbs_target_g: goal.carbs_target_g || computedTargets.carbs_g,
      fat_target_g: goal.fat_target_g || computedTargets.fat_g,
      fiber_target_g: goal.fiber_target_g || computedTargets.fiber_g,
      sodium_target_mg: goal.sodium_target_mg || computedTargets.sodium_mg,
      water_target_min_liters: goal.water_target_min_liters || computedTargets.water_min_liters,
      water_target_max_liters: goal.water_target_max_liters || computedTargets.water_max_liters,
      safety_flags: goal.safety_flags?.length
        ? goal.safety_flags
        : buildSafetyFlags(profile, goal.goal_type, goal.current_weight_kg, goal.target_weight_kg, goal.target_date, goal.medical_conditions_snapshot || preferences.medical_conditions),
    };

    let plan = buildFallbackMealPlan({
      profile,
      preferences,
      goal: hydratedGoal,
      countryCuisine: countryCuisine ?? null,
      foods: foods ?? [],
      planDate,
      dayNumber,
      previousMeals,
      isWorkoutDay,
    });

    if (isVertexConfigured()) {
      try {
        const generatedPlan = await generateStructuredContent<typeof plan>(
          Deno.env.get('VERTEX_GEMINI_MODEL') ?? 'gemini-2.5-pro',
          buildPlanPrompt({
            profile,
            preferences,
            goal: hydratedGoal,
            countryCuisine: countryCuisine ?? null,
            foods: foods ?? [],
            previousMeals,
            planDate,
            dayNumber,
            isWorkoutDay,
          }),
          'You are Chef Mo, an expert nutrition planner. Return only valid JSON.',
        );

        if (generatedPlan) {
          plan = normalizeGeneratedPlan(generatedPlan, plan);
        }
      } catch (error) {
        console.error('Vertex nutrition plan generation failed', error);
        // Fallback stays in place if Vertex is unavailable or parsing fails.
      }
    }

    const insertPayload = {
      user_id: userId,
      goal_id: goal.id,
      plan_date: plan.plan_date,
      day_number: plan.day_number,
      total_calories: plan.total_calories,
      total_protein_g: plan.total_protein_g,
      total_carbs_g: plan.total_carbs_g,
      total_fat_g: plan.total_fat_g,
      total_fiber_g: plan.total_fiber_g,
      total_sodium_mg: plan.total_sodium_mg,
      water_target_liters: plan.water_target_liters,
      water_schedule: plan.water_schedule,
      meals: plan.meals,
      ai_notes: plan.ai_daily_note,
      workout_day: isWorkoutDay,
    };

    const { data: savedPlan, error: saveError } = await admin
      .from('daily_meal_plans')
      .insert(insertPayload)
      .select('*')
      .single();

    if (saveError) {
      throw saveError;
    }

    return jsonResponse(savedPlan ?? insertPayload);
  } catch (error) {
    console.error('nutrition-plan failed', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown nutrition plan error' }, 400);
  }
});

