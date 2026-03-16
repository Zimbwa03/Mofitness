interface UserProfileRow {
  id: string;
  full_name: string;
  gender: string | null;
  date_of_birth: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: string | null;
}

interface PreferencesRow {
  dietary_restrictions: string[];
  medical_conditions: string;
  country_code: string | null;
  allergies: string[];
  cuisine_preferences: string[];
}

interface NutritionGoalRow {
  id: string;
  goal_type: string;
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
  safety_flags: string[];
}

interface CountryCuisineRow {
  country_code: string;
  country_name: string;
  cuisine_tags: string[];
  staples: string[];
  proteins: string[];
  carbs: string[];
  vegetables: string[];
}

interface RegionalFoodRow {
  id: string;
  name: string;
  local_name: string | null;
  country_codes: string[];
  calories_per_100g: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number | null;
  category: string;
}

interface MealDish {
  name: string;
  local_name: string | null;
  quantity_g: number;
  quantity_display: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  cooking_method: string;
  nutritional_benefit: string;
}

interface PlannedMeal {
  slot: string;
  local_name: string;
  english_name: string;
  suggested_time: string;
  prep_time_minutes: number;
  difficulty: 'easy' | 'medium' | 'complex';
  why_this_meal: string;
  pre_meal_action: string;
  post_meal_action: string;
  workout_relation: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  dishes: MealDish[];
  ingredients_shopping: Array<{ item: string; quantity: string; notes: string | null }>;
  image_generation_prompt: string;
}

interface DailyMealPlan {
  plan_date: string;
  day_number: number;
  ai_daily_note: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  total_fiber_g: number;
  total_sodium_mg: number;
  water_target_liters: number;
  water_schedule: Array<{ time: string; amount_ml: number; reason: string }>;
  meals: PlannedMeal[];
}

interface DailyTargets {
  dailyCalorieTarget: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sodium_mg: number;
  water_min_liters: number;
  water_max_liters: number;
}

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

const slotDefinitions: Record<number, Array<{ slot: string; time: string }>> = {
  1: [{ slot: 'dinner', time: '18:30' }],
  2: [
    { slot: 'breakfast', time: '08:00' },
    { slot: 'dinner', time: '18:30' },
  ],
  3: [
    { slot: 'breakfast', time: '07:30' },
    { slot: 'lunch', time: '13:00' },
    { slot: 'dinner', time: '19:00' },
  ],
  4: [
    { slot: 'breakfast', time: '07:30' },
    { slot: 'lunch', time: '12:30' },
    { slot: 'snack_1', time: '16:00' },
    { slot: 'dinner', time: '19:30' },
  ],
  5: [
    { slot: 'breakfast', time: '07:00' },
    { slot: 'snack_1', time: '10:00' },
    { slot: 'lunch', time: '13:00' },
    { slot: 'snack_2', time: '16:30' },
    { slot: 'dinner', time: '19:30' },
  ],
  6: [
    { slot: 'breakfast', time: '07:00' },
    { slot: 'snack_1', time: '09:30' },
    { slot: 'lunch', time: '12:30' },
    { slot: 'snack_2', time: '15:30' },
    { slot: 'dinner', time: '18:30' },
    { slot: 'snack_3', time: '21:00' },
  ],
};

function roundTo(value: number, decimals = 1) {
  return Number(value.toFixed(decimals));
}

function toInt(value: number) {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function calculateAge(dateOfBirth: string | null) {
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

export function calculateBMR(profile: UserProfileRow) {
  const weight = Number(profile.weight_kg ?? 70);
  const height = Number(profile.height_cm ?? 170);
  const age = calculateAge(profile.date_of_birth);
  const sexOffset = profile.gender === 'male' ? 5 : -161;
  return 10 * weight + 6.25 * height - 5 * age + sexOffset;
}

export function calculateDailyTargets(
  profile: UserProfileRow,
  goalType: string,
  currentWeightKg: number,
  targetWeightKg: number | null,
  targetDate: string,
  isWorkoutDay: boolean,
): DailyTargets {
  const activityLevel = profile.activity_level ?? 'lightly_active';
  const tdee = calculateBMR(profile) * (activityMultipliers[activityLevel] ?? 1.375);
  const daysToGoal = Math.max(1, Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86_400_000));
  const totalWeightDelta = (targetWeightKg ?? currentWeightKg) - currentWeightKg;
  const weeklyChange = (totalWeightDelta / daysToGoal) * 7;
  const dailyCalorieDelta = (weeklyChange * 7700) / 7;
  const calorieTarget = clamp(Math.round(tdee + dailyCalorieDelta), 1200, 5000);
  const split = macroSplits[goalType] ?? macroSplits.general_health;
  const waterBase = currentWeightKg * 0.035;

  return {
    dailyCalorieTarget: calorieTarget,
    protein_g: Math.round((calorieTarget * split.protein) / 4),
    carbs_g: Math.round((calorieTarget * split.carbs) / 4),
    fat_g: Math.round((calorieTarget * split.fat) / 9),
    fiber_g: goalType === 'lose_weight' || goalType === 'cut_fat' ? 32 : 28,
    sodium_mg: 2300,
    water_min_liters: roundTo(waterBase + (isWorkoutDay ? 0.3 : 0), 1),
    water_max_liters: roundTo(waterBase + (isWorkoutDay ? 0.9 : 0.6), 1),
  };
}

export function buildSafetyFlags(
  profile: UserProfileRow,
  goalType: string,
  currentWeightKg: number,
  targetWeightKg: number | null,
  targetDate: string,
  medicalConditions: string,
) {
  const flags = new Set<string>();
  const age = calculateAge(profile.date_of_birth);
  const daysToGoal = Math.max(1, Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86_400_000));
  const weeklyChange = (((targetWeightKg ?? currentWeightKg) - currentWeightKg) / daysToGoal) * 7;

  if (age < 18) {
    flags.add('minor_requires_professional_guidance');
  }

  if (medicalConditions.trim()) {
    flags.add('medical_condition_review');
  }

  if (goalType === 'medical_dietary') {
    flags.add('medical_dietary_goal_requires_clinician');
  }

  if ((goalType === 'gain_weight' || goalType === 'build_muscle') && weeklyChange > 0.5) {
    flags.add('aggressive_weight_gain_rate');
  }

  if ((goalType === 'lose_weight' || goalType === 'cut_fat') && weeklyChange < -0.75) {
    flags.add('aggressive_weight_loss_rate');
  }

  return Array.from(flags);
}

function foodAmount(food: RegionalFoodRow, grams: number) {
  const multiplier = grams / 100;
  return {
    calories: roundTo(food.calories_per_100g * multiplier, 0),
    protein_g: roundTo(food.protein_g * multiplier),
    carbs_g: roundTo(food.carbs_g * multiplier),
    fat_g: roundTo(food.fat_g * multiplier),
    fiber_g: roundTo(food.fiber_g * multiplier),
    sodium_mg: roundTo((food.sodium_mg ?? 0) * multiplier, 0),
  };
}

function quantityDisplay(grams: number) {
  if (grams >= 240) {
    return `${roundTo(grams / 160)} cups (${grams}g)`;
  }

  if (grams >= 100) {
    return `${roundTo(grams / 100)} serving (${grams}g)`;
  }

  return `${grams}g`;
}

function getCountryFoods(foods: RegionalFoodRow[], countryCode: string) {
  const matching = foods.filter((food) => food.country_codes.includes(countryCode));
  return matching.length > 0 ? matching : foods;
}

function pickFood(
  foods: RegionalFoodRow[],
  category: string | string[],
  usedNames: Set<string>,
  offset = 0,
) {
  const categories = Array.isArray(category) ? category : [category];
  const candidates = foods.filter((food) => categories.includes(food.category));
  const fresh = candidates.filter((food) => !usedNames.has(food.name.toLowerCase()));
  const pool = fresh.length > 0 ? fresh : candidates;

  if (pool.length === 0) {
    return null;
  }

  return pool[offset % pool.length];
}

function makeDish(food: RegionalFoodRow, grams: number, cookingMethod: string, nutritionalBenefit: string): MealDish {
  const roundedGrams = Math.max(50, Math.round(grams / 5) * 5);
  const amount = foodAmount(food, roundedGrams);

  return {
    name: food.name,
    local_name: food.local_name,
    quantity_g: roundedGrams,
    quantity_display: quantityDisplay(roundedGrams),
    calories: amount.calories,
    protein_g: amount.protein_g,
    carbs_g: amount.carbs_g,
    fat_g: amount.fat_g,
    fiber_g: amount.fiber_g,
    sodium_mg: amount.sodium_mg,
    cooking_method: cookingMethod,
    nutritional_benefit: nutritionalBenefit,
  };
}

function sumMealTotals(dishes: MealDish[]) {
  return dishes.reduce(
    (acc, dish) => ({
      calories: acc.calories + dish.calories,
      protein_g: roundTo(acc.protein_g + dish.protein_g),
      carbs_g: roundTo(acc.carbs_g + dish.carbs_g),
      fat_g: roundTo(acc.fat_g + dish.fat_g),
      fiber_g: roundTo(acc.fiber_g + dish.fiber_g),
      sodium_mg: acc.sodium_mg + dish.sodium_mg,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 0 },
  );
}

function imagePrompt(meal: PlannedMeal, countryName: string) {
  const dishList = meal.dishes.map((dish) => `${dish.name} ${dish.quantity_display}`).join(', ');
  return `Professional food photography of ${meal.english_name} from ${countryName}, overhead shot, warm natural light, plated with ${dishList}, traditional tableware, square composition, no text, no people.`;
}

function shoppingItems(dishes: MealDish[]) {
  return dishes.map((dish) => ({
    item: dish.name,
    quantity: dish.quantity_display,
    notes: dish.local_name ? `Local name: ${dish.local_name}` : null,
  }));
}

function buildWaterSchedule(totalLiters: number, mealSlots: Array<{ slot: string; time: string }>) {
  const totalMl = Math.round(totalLiters * 1000);
  const events = [
    { time: '06:30', amount_ml: Math.round(totalMl * 0.18), reason: 'Start the day hydrated.' },
    ...mealSlots.map((slot) => ({
      time: slot.time,
      amount_ml: Math.round(totalMl * 0.14),
      reason: `Drink before ${slot.slot.replaceAll('_', ' ')}.`,
    })),
    { time: '21:00', amount_ml: Math.round(totalMl * 0.12), reason: 'Close the day with light hydration.' },
  ];

  return events;
}

function describeGoal(goalType: string) {
  switch (goalType) {
    case 'gain_weight':
      return 'steady healthy weight gain';
    case 'lose_weight':
      return 'gradual fat loss';
    case 'build_muscle':
      return 'muscle building';
    case 'cut_fat':
      return 'cutting body fat';
    case 'athletic_performance':
      return 'athletic performance';
    case 'medical_dietary':
      return 'nutrition with medical guardrails';
    default:
      return 'daily health';
  }
}

function coachingNote(goalType: string, isWorkoutDay: boolean) {
  if (isWorkoutDay) {
    return `Today is a training day, so meals are timed to support ${describeGoal(goalType)} with better fuel and recovery.`;
  }

  return `Today is a recovery day, so the plan keeps protein steady while controlling energy around your ${describeGoal(goalType)} target.`;
}

export function buildFallbackMealPlan(args: {
  profile: UserProfileRow;
  preferences: PreferencesRow;
  goal: NutritionGoalRow;
  countryCuisine: CountryCuisineRow | null;
  foods: RegionalFoodRow[];
  planDate: string;
  dayNumber: number;
  previousMeals: string[];
  isWorkoutDay: boolean;
}) {
  const { profile, preferences, goal, countryCuisine, foods, planDate, dayNumber, previousMeals, isWorkoutDay } = args;
  const slotPlan = slotDefinitions[goal.meals_per_day] ?? slotDefinitions[4];
  const countryFoods = getCountryFoods(foods, goal.country_code);
  const usedNames = new Set(previousMeals.map((name) => name.toLowerCase()));
  const meals: PlannedMeal[] = [];
  const calorieShare = slotPlan.map((slot) => {
    if (slot.slot.startsWith('snack')) {
      return 0.12;
    }
    if (slot.slot === 'breakfast') {
      return 0.24;
    }
    if (slot.slot === 'lunch') {
      return 0.28;
    }
    return 0.24;
  });
  const shareTotal = calorieShare.reduce((sum, value) => sum + value, 0);
  const normalizedShares = calorieShare.map((share) => share / shareTotal);

  slotPlan.forEach((slot, index) => {
    const targetCalories = goal.daily_calorie_target * normalizedShares[index];
    const stapleCategory = slot.slot.startsWith('snack') ? ['dairy', 'grain', 'legume'] : ['grain', 'mixed_dish'];
    const proteinCategory = slot.slot.startsWith('snack') ? ['dairy', 'protein', 'legume'] : ['protein', 'legume'];
    const vegetableCategory = slot.slot.startsWith('snack') ? ['fruit', 'vegetable'] : ['vegetable'];
    const stapleFood = pickFood(countryFoods, stapleCategory, usedNames, index) ?? countryFoods[0];
    const proteinFood = pickFood(countryFoods, proteinCategory, usedNames, index + 1) ?? stapleFood;
    const vegetableFood = pickFood(countryFoods, vegetableCategory, usedNames, index + 2) ?? null;

    usedNames.add(stapleFood.name.toLowerCase());
    usedNames.add(proteinFood.name.toLowerCase());
    if (vegetableFood) {
      usedNames.add(vegetableFood.name.toLowerCase());
    }

    const stapleCalories = slot.slot.startsWith('snack') ? targetCalories * 0.45 : targetCalories * 0.5;
    const proteinCalories = slot.slot.startsWith('snack') ? targetCalories * 0.4 : targetCalories * 0.35;
    const vegCalories = vegetableFood ? targetCalories * 0.15 : 0;

    const dishes = [
      makeDish(
        stapleFood,
        (stapleCalories / stapleFood.calories_per_100g) * 100,
        slot.slot === 'breakfast' ? 'Simmer until soft and warm.' : 'Prepare and season lightly for the day target.',
        `Supports ${describeGoal(goal.goal_type)} with reliable energy.`,
      ),
      makeDish(
        proteinFood,
        (proteinCalories / proteinFood.calories_per_100g) * 100,
        'Cook with minimal added fat and keep the portion measured.',
        'Adds the protein needed to keep the plan aligned with your target.',
      ),
    ];

    if (vegetableFood) {
      dishes.push(
        makeDish(
          vegetableFood,
          Math.max(80, (vegCalories / vegetableFood.calories_per_100g) * 100),
          'Lightly steam or saute to preserve texture.',
          'Adds fiber and micronutrients without unnecessary calories.',
        ),
      );
    }

    const totals = sumMealTotals(dishes);
    const englishName = `${stapleFood.name} with ${proteinFood.name}`;
    const localName = stapleFood.local_name ?? countryCuisine?.cuisine_tags?.[index % (countryCuisine?.cuisine_tags.length || 1)] ?? englishName;

    meals.push({
      slot: slot.slot,
      local_name: localName,
      english_name: englishName,
      suggested_time: slot.time,
      prep_time_minutes: slot.slot.startsWith('snack') ? 10 : 25,
      difficulty: slot.slot.startsWith('snack') ? 'easy' : 'medium',
      why_this_meal: `${englishName} balances measured energy and protein for ${describeGoal(goal.goal_type)} without relying on generic meal templates.`,
      pre_meal_action: slot.slot.startsWith('snack') ? 'Drink 300ml water 15 minutes before.' : 'Drink 500ml water 20 minutes before.',
      post_meal_action: isWorkoutDay && (slot.slot === 'lunch' || slot.slot === 'snack_1')
        ? 'Keep activity light until your workout window.'
        : 'Log this meal after eating so the rest of the day can adjust.',
      workout_relation: isWorkoutDay && (slot.slot === 'lunch' || slot.slot === 'snack_1')
        ? 'pre_workout'
        : isWorkoutDay && slot.slot === 'dinner'
          ? 'post_workout'
          : null,
      calories: totals.calories,
      protein_g: totals.protein_g,
      carbs_g: totals.carbs_g,
      fat_g: totals.fat_g,
      fiber_g: totals.fiber_g,
      sodium_mg: totals.sodium_mg,
      dishes,
      ingredients_shopping: shoppingItems(dishes),
      image_generation_prompt: imagePrompt(
        {
          slot: slot.slot,
          local_name: localName,
          english_name: englishName,
          suggested_time: slot.time,
          prep_time_minutes: 0,
          difficulty: 'easy',
          why_this_meal: '',
          pre_meal_action: '',
          post_meal_action: '',
          workout_relation: null,
          calories: totals.calories,
          protein_g: totals.protein_g,
          carbs_g: totals.carbs_g,
          fat_g: totals.fat_g,
          fiber_g: totals.fiber_g,
          sodium_mg: totals.sodium_mg,
          dishes,
          ingredients_shopping: [],
          image_generation_prompt: '',
        },
        countryCuisine?.country_name ?? goal.country_code,
      ),
    });
  });

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein_g: roundTo(acc.protein_g + meal.protein_g),
      carbs_g: roundTo(acc.carbs_g + meal.carbs_g),
      fat_g: roundTo(acc.fat_g + meal.fat_g),
      fiber_g: roundTo(acc.fiber_g + meal.fiber_g),
      sodium_mg: acc.sodium_mg + meal.sodium_mg,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sodium_mg: 0 },
  );

  const waterTarget = roundTo((goal.water_target_min_liters + goal.water_target_max_liters) / 2, 1);

  return {
    plan_date: planDate,
    day_number: dayNumber,
    ai_daily_note: coachingNote(goal.goal_type, isWorkoutDay),
    total_calories: toInt(totals.calories),
    total_protein_g: totals.protein_g,
    total_carbs_g: totals.carbs_g,
    total_fat_g: totals.fat_g,
    total_fiber_g: totals.fiber_g,
    total_sodium_mg: totals.sodium_mg,
    water_target_liters: waterTarget,
    water_schedule: buildWaterSchedule(waterTarget, slotPlan),
    meals,
  } satisfies DailyMealPlan;
}

export function buildRemainingMeals(args: {
  goal: NutritionGoalRow;
  countryCuisine: CountryCuisineRow | null;
  foods: RegionalFoodRow[];
  remainingMealSlots: string[];
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
}) {
  const { goal, countryCuisine, foods, remainingMealSlots, consumedCalories, consumedProtein, consumedCarbs, consumedFat } = args;
  const remainingCount = Math.max(1, remainingMealSlots.length);
  const remainingTarget = {
    calories: Math.max(200, goal.daily_calorie_target - consumedCalories),
    protein: Math.max(10, goal.protein_target_g - consumedProtein),
    carbs: Math.max(10, goal.carbs_target_g - consumedCarbs),
    fat: Math.max(5, goal.fat_target_g - consumedFat),
  };

  const syntheticGoal: NutritionGoalRow = {
    ...goal,
    daily_calorie_target: remainingTarget.calories,
    protein_target_g: Math.round(remainingTarget.protein),
    carbs_target_g: Math.round(remainingTarget.carbs),
    fat_target_g: Math.round(remainingTarget.fat),
    meals_per_day: remainingCount,
  };

  const plan = buildFallbackMealPlan({
    profile: {
      id: 'synthetic',
      full_name: 'User',
      gender: null,
      date_of_birth: null,
      height_cm: null,
      weight_kg: goal.current_weight_kg,
      activity_level: 'lightly_active',
    },
    preferences: {
      dietary_restrictions: goal.dietary_restrictions_snapshot,
      medical_conditions: goal.medical_conditions_snapshot,
      country_code: goal.country_code,
      allergies: goal.allergies_snapshot,
      cuisine_preferences: goal.cuisine_preference,
    },
    goal: syntheticGoal,
    countryCuisine,
    foods,
    planDate: new Date().toISOString().slice(0, 10),
    dayNumber: 1,
    previousMeals: [],
    isWorkoutDay: false,
  });

  return plan.meals.map((meal, index) => ({
    ...meal,
    slot: remainingMealSlots[index] ?? meal.slot,
  }));
}

export type {
  CountryCuisineRow,
  DailyMealPlan,
  DailyTargets,
  NutritionGoalRow,
  PlannedMeal,
  PreferencesRow,
  RegionalFoodRow,
  UserProfileRow,
};
