import type { DailyMealPlan, MealSlot, PlannedDish, PlannedMeal, RegionalFood, ShoppingItem } from "../models";

const SLOT_DEFINITIONS: Record<number, Array<{ slot: MealSlot; time: string }>> = {
  1: [{ slot: "dinner", time: "18:30" }],
  2: [
    { slot: "breakfast", time: "08:00" },
    { slot: "dinner", time: "18:30" },
  ],
  3: [
    { slot: "breakfast", time: "07:30" },
    { slot: "lunch", time: "13:00" },
    { slot: "dinner", time: "19:00" },
  ],
  4: [
    { slot: "breakfast", time: "07:30" },
    { slot: "lunch", time: "12:30" },
    { slot: "snack_1", time: "16:00" },
    { slot: "dinner", time: "19:30" },
  ],
  5: [
    { slot: "breakfast", time: "07:00" },
    { slot: "snack_1", time: "10:00" },
    { slot: "lunch", time: "13:00" },
    { slot: "snack_2", time: "16:30" },
    { slot: "dinner", time: "19:30" },
  ],
  6: [
    { slot: "breakfast", time: "07:00" },
    { slot: "snack_1", time: "09:30" },
    { slot: "lunch", time: "12:30" },
    { slot: "snack_2", time: "15:30" },
    { slot: "dinner", time: "18:30" },
    { slot: "snack_3", time: "21:00" },
  ],
};

const VALID_MEAL_SLOTS = new Set<MealSlot>(["breakfast", "lunch", "dinner", "snack_1", "snack_2", "snack_3"]);
const VALID_DIFFICULTIES = new Set<PlannedMeal["difficulty"]>(["easy", "medium", "complex"]);
const TODAY_NUTRIENT_TARGETS = {
  iron_mg: 18,
  calcium_mg: 1000,
  fiber_g: 30,
  sodium_mg: 2300,
} as const;

export interface NutrientSignal {
  key: "iron_mg" | "calcium_mg" | "fiber_g" | "sodium_mg";
  label: string;
  value: number;
  target: number;
  unit: string;
  note: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getSlotPlan(totalMeals: number) {
  return SLOT_DEFINITIONS[totalMeals] ?? SLOT_DEFINITIONS[4];
}

function inferSlot(index: number, totalMeals: number) {
  const plan = getSlotPlan(totalMeals);
  return plan[index] ?? plan[Math.min(index, plan.length - 1)] ?? SLOT_DEFINITIONS[4][0];
}

function normalizeShoppingItems(items: unknown, dishes: PlannedDish[]): ShoppingItem[] {
  if (Array.isArray(items) && items.length > 0) {
    return items.map((item) => {
      const row = isObject(item) ? item : {};
      return {
        item: asString(row.item, "Ingredient"),
        quantity: asString(row.quantity, "To taste"),
        notes: asNullableString(row.notes),
      };
    });
  }

  return dishes.map((dish) => ({
    item: dish.name,
    quantity: dish.quantity_display,
    notes: dish.local_name ? `Local name: ${dish.local_name}` : null,
  }));
}

function normalizeDish(dish: unknown, index: number): PlannedDish {
  const row = isObject(dish) ? dish : {};
  const quantity = asNumber(row.quantity_g, 0);

  return {
    name: asString(row.name, `Dish ${index + 1}`),
    local_name: asNullableString(row.local_name),
    quantity_g: quantity,
    quantity_display: asString(row.quantity_display, quantity > 0 ? `${quantity}g` : "1 serving"),
    calories: asNumber(row.calories, 0),
    protein_g: asNumber(row.protein_g, 0),
    carbs_g: asNumber(row.carbs_g, 0),
    fat_g: asNumber(row.fat_g, 0),
    fiber_g: asNumber(row.fiber_g, 0),
    sodium_mg: asNumber(row.sodium_mg, 0),
    cooking_method: asString(row.cooking_method, "Prepared to match the plan."),
    nutritional_benefit: asString(row.nutritional_benefit, "Supports the current daily nutrition target."),
  };
}

export function formatMealSlot(slot?: string | null) {
  if (!slot) {
    return "meal";
  }

  return slot.replaceAll("_", " ");
}

export function formatGoalType(goalType?: string | null) {
  if (!goalType) {
    return "goal";
  }

  return goalType.replaceAll("_", " ");
}

export function splitActionText(text?: string | null) {
  if (!text) {
    return [];
  }

  return text
    .split(/\n|•|;|(?<!\d)\.\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeFoodName(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchFoodForDish(dish: PlannedDish, foods: RegionalFood[]) {
  const dishNames = [dish.name, dish.local_name].map((value) => normalizeFoodName(value)).filter(Boolean);
  if (dishNames.length === 0) {
    return null;
  }

  return (
    foods.find((food) => {
      const foodNames = [food.name, food.local_name].map((value) => normalizeFoodName(value)).filter(Boolean);
      return foodNames.some((foodName) => dishNames.some((dishName) => foodName === dishName || foodName.includes(dishName) || dishName.includes(foodName)));
    }) ?? null
  );
}

function accumulateSignals(dishes: PlannedDish[], foods: RegionalFood[]) {
  return dishes.reduce(
    (acc, dish) => {
      const matchedFood = matchFoodForDish(dish, foods);
      const scale = dish.quantity_g / 100;

      return {
        iron_mg: acc.iron_mg + Number(((matchedFood?.iron_mg ?? 0) * scale).toFixed(2)),
        calcium_mg: acc.calcium_mg + Number(((matchedFood?.calcium_mg ?? 0) * scale).toFixed(1)),
        fiber_g: acc.fiber_g + Number(dish.fiber_g ?? 0),
        sodium_mg: acc.sodium_mg + Number(dish.sodium_mg ?? 0),
      };
    },
    { iron_mg: 0, calcium_mg: 0, fiber_g: 0, sodium_mg: 0 },
  );
}

export function buildMealNutrientSignals(
  meal: PlannedMeal,
  foods: RegionalFood[],
  fiberTarget: number = TODAY_NUTRIENT_TARGETS.fiber_g,
  sodiumTarget: number = TODAY_NUTRIENT_TARGETS.sodium_mg,
): NutrientSignal[] {
  const totals = accumulateSignals(meal.dishes, foods);

  return [
    {
      key: "iron_mg",
      label: "Iron",
      value: Number(totals.iron_mg.toFixed(1)),
      target: TODAY_NUTRIENT_TARGETS.iron_mg,
      unit: "mg",
      note: "Estimated from matched regional foods in this meal.",
    },
    {
      key: "calcium_mg",
      label: "Calcium",
      value: Number(totals.calcium_mg.toFixed(0)),
      target: TODAY_NUTRIENT_TARGETS.calcium_mg,
      unit: "mg",
      note: "Estimated from seeded regional food references.",
    },
    {
      key: "fiber_g",
      label: "Fiber",
      value: Number(totals.fiber_g.toFixed(1)),
      target: fiberTarget,
      unit: "g",
      note: "Tracked directly from the meal dishes.",
    },
    {
      key: "sodium_mg",
      label: "Sodium",
      value: Number(totals.sodium_mg.toFixed(0)),
      target: sodiumTarget,
      unit: "mg",
      note: "Kept below the daily cap where possible.",
    },
  ];
}

export function buildPlanNutrientSignals(
  plan: DailyMealPlan,
  foods: RegionalFood[],
  fiberTarget: number = TODAY_NUTRIENT_TARGETS.fiber_g,
  sodiumTarget: number = TODAY_NUTRIENT_TARGETS.sodium_mg,
): NutrientSignal[] {
  const totals = plan.meals.reduce(
    (acc, meal) => {
      const next = accumulateSignals(meal.dishes, foods);
      return {
        iron_mg: acc.iron_mg + next.iron_mg,
        calcium_mg: acc.calcium_mg + next.calcium_mg,
        fiber_g: acc.fiber_g + next.fiber_g,
        sodium_mg: acc.sodium_mg + next.sodium_mg,
      };
    },
    { iron_mg: 0, calcium_mg: 0, fiber_g: 0, sodium_mg: 0 },
  );

  return [
    {
      key: "iron_mg",
      label: "Iron",
      value: Number(totals.iron_mg.toFixed(1)),
      target: TODAY_NUTRIENT_TARGETS.iron_mg,
      unit: "mg",
      note: "Estimated from dishes that matched the regional food database.",
    },
    {
      key: "calcium_mg",
      label: "Calcium",
      value: Number(totals.calcium_mg.toFixed(0)),
      target: TODAY_NUTRIENT_TARGETS.calcium_mg,
      unit: "mg",
      note: "Useful for bone support and training recovery.",
    },
    {
      key: "fiber_g",
      label: "Fiber",
      value: Number(totals.fiber_g.toFixed(1)),
      target: fiberTarget,
      unit: "g",
      note: "Important for satiety and digestion across the day.",
    },
    {
      key: "sodium_mg",
      label: "Sodium",
      value: Number(totals.sodium_mg.toFixed(0)),
      target: sodiumTarget,
      unit: "mg",
      note: "Shown against the daily upper limit.",
    },
  ];
}

export function getMealStatus(meal: PlannedMeal, planDate: string, isLogged: boolean, now = new Date()) {
  if (isLogged) {
    return { key: "logged", label: "Logged", color: "#43B66E" };
  }

  const todayKey = now.toISOString().slice(0, 10);
  if (planDate < todayKey) {
    return { key: "missed", label: "Missed", color: "#C95E4E" };
  }

  if (planDate > todayKey) {
    return { key: "upcoming", label: "Upcoming", color: "#75808A" };
  }

  const [hours, minutes] = meal.suggested_time.split(":").map((value) => Number(value));
  const targetTime = new Date(now);
  targetTime.setHours(hours || 0, minutes || 0, 0, 0);
  const deltaMinutes = (now.getTime() - targetTime.getTime()) / 60_000;

  if (deltaMinutes >= -45 && deltaMinutes <= 60) {
    return { key: "current", label: "Current", color: "#C8F135" };
  }

  if (deltaMinutes > 60) {
    return { key: "missed", label: "Missed", color: "#C95E4E" };
  }

  return { key: "upcoming", label: "Upcoming", color: "#75808A" };
}

export function normalizePlannedMeal(meal: unknown, index: number, totalMeals: number): PlannedMeal {
  const row = isObject(meal) ? meal : {};
  const fallbackSlot = inferSlot(index, totalMeals);
  const slot = VALID_MEAL_SLOTS.has(row.slot as MealSlot) ? (row.slot as MealSlot) : fallbackSlot.slot;
  const dishes = Array.isArray(row.dishes) ? row.dishes.map((dish, dishIndex) => normalizeDish(dish, dishIndex)) : [];
  const englishName = asString(row.english_name, `${formatMealSlot(slot)} meal`);
  const localName = asString(row.local_name, englishName);

  return {
    slot,
    local_name: localName,
    english_name: englishName,
    suggested_time: asString(row.suggested_time, fallbackSlot.time),
    prep_time_minutes: asNumber(row.prep_time_minutes, slot.startsWith("snack") ? 10 : 25),
    difficulty: VALID_DIFFICULTIES.has(row.difficulty as PlannedMeal["difficulty"])
      ? (row.difficulty as PlannedMeal["difficulty"])
      : "easy",
    why_this_meal: asString(row.why_this_meal, "Built from your current nutrition target."),
    pre_meal_action: asString(row.pre_meal_action, "Drink water before this meal."),
    post_meal_action: asString(row.post_meal_action, "Log the meal after eating."),
    workout_relation: typeof row.workout_relation === "string" ? row.workout_relation : null,
    calories: asNumber(row.calories, 0),
    protein_g: asNumber(row.protein_g, 0),
    carbs_g: asNumber(row.carbs_g, 0),
    fat_g: asNumber(row.fat_g, 0),
    fiber_g: asNumber(row.fiber_g, 0),
    sodium_mg: asNumber(row.sodium_mg, 0),
    dishes,
    ingredients_shopping: normalizeShoppingItems(row.ingredients_shopping, dishes),
    image_generation_prompt: asString(row.image_generation_prompt, `Healthy plated ${englishName}.`),
  };
}

export function normalizeDailyMealPlan(plan: DailyMealPlan | null | undefined): DailyMealPlan | null {
  if (!plan) {
    return null;
  }

  const totalMeals = Array.isArray(plan.meals) && plan.meals.length > 0 ? plan.meals.length : 4;
  const meals = (Array.isArray(plan.meals) ? plan.meals : []).map((meal, index) => normalizePlannedMeal(meal, index, totalMeals));
  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: Number((acc.protein + meal.protein_g).toFixed(1)),
      carbs: Number((acc.carbs + meal.carbs_g).toFixed(1)),
      fat: Number((acc.fat + meal.fat_g).toFixed(1)),
      fiber: Number((acc.fiber + meal.fiber_g).toFixed(1)),
      sodium: acc.sodium + meal.sodium_mg,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 },
  );

  return {
    ...plan,
    meals,
    total_calories: asNumber(plan.total_calories, totals.calories),
    total_protein_g: asNumber(plan.total_protein_g, totals.protein),
    total_carbs_g: asNumber(plan.total_carbs_g, totals.carbs),
    total_fat_g: asNumber(plan.total_fat_g, totals.fat),
    total_fiber_g: plan.total_fiber_g ?? totals.fiber,
    total_sodium_mg: plan.total_sodium_mg ?? totals.sodium,
    water_schedule: Array.isArray(plan.water_schedule) ? plan.water_schedule : [],
  };
}
