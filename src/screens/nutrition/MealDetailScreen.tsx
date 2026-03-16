import { useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachMessageBubble } from '../../components/coach/CoachMessageBubble';
import { MoButton } from '../../components/common/MoButton';
import { MoCard } from '../../components/common/MoCard';
import { useAuth } from '../../hooks/useAuth';
import type { DailyMealPlan, PlannedMeal } from '../../models';
import type { NutritionStackParamList } from '../../navigation/types';
import nutritionService from '../../services/NutritionService';
import { useNutritionStore } from '../../stores/nutritionStore';
import { colors, layout, theme, typography } from '../../theme';
import { buildMealNutrientSignals } from '../../utils/nutrition';
import { getScreenBottomPadding } from '../../utils/screen';
import { IngredientChecklist } from './components/IngredientChecklist';
import { MacroRing } from './components/MacroRing';
import { MealDetailCard } from './components/MealDetailCard';
import { MealImageGenerator } from './components/MealImageGenerator';
import { NutrientRow } from './components/NutrientRow';
import { PrePostMealCard } from './components/PrePostMealCard';

type Props = NativeStackScreenProps<NutritionStackParamList, 'MealDetail'>;

export function MealDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const activeGoal = useNutritionStore((state) => state.activeGoal);
  const mealPlans = useNutritionStore((state) => state.mealPlans);
  const upsertMealPlan = useNutritionStore((state) => state.upsertMealPlan);
  const regionalFoods = useNutritionStore((state) => state.regionalFoods);
  const setRegionalFoods = useNutritionStore((state) => state.setRegionalFoods);
  const countryCuisines = useNutritionStore((state) => state.countryCuisines);
  const [tab, setTab] = useState<'macros' | 'micros' | 'dishes' | 'ingredients'>('macros');
  const [plan, setPlan] = useState<DailyMealPlan | null>(mealPlans.find((row) => row.id === route.params.planId) ?? null);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!plan) {
      nutritionService
        .getPlans(user.id)
        .then((rows) => {
          const match = rows.find((row) => row.id === route.params.planId) ?? null;
          setPlan(match);
        })
        .catch(() => undefined);
    }

    if (regionalFoods.length === 0) {
      nutritionService.getRegionalFoods(activeGoal?.country_code).then((rows) => setRegionalFoods(rows)).catch(() => undefined);
    }
  }, [activeGoal?.country_code, plan, regionalFoods.length, route.params.planId, setRegionalFoods, user]);

  const meal = useMemo<PlannedMeal | null>(() => plan?.meals.find((row) => row.slot === route.params.mealSlot) ?? null, [plan, route.params.mealSlot]);
  const nutrientSignals = useMemo(() => {
    if (!meal) {
      return [];
    }

    return buildMealNutrientSignals(meal, regionalFoods, activeGoal?.fiber_target_g ?? 30, activeGoal?.sodium_target_mg ?? 2300);
  }, [activeGoal?.fiber_target_g, activeGoal?.sodium_target_mg, meal, regionalFoods]);

  if (!plan || !meal || !activeGoal) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}>
        <MoCard>
          <Text style={styles.title}>Meal not available</Text>
        </MoCard>
      </ScrollView>
    );
  }

  const countryName = countryCuisines.find((row) => row.country_code === activeGoal.country_code)?.country_name ?? activeGoal.country_code;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
      showsVerticalScrollIndicator={false}
    >
      <MoCard>
        <MealImageGenerator
          meal={meal}
          planId={plan.id}
          countryCode={activeGoal.country_code}
          countryName={countryName}
          imageUrl={plan.generated_image_url}
          onGenerated={(imageUrl) => {
            const nextPlan = { ...plan, generated_image_url: imageUrl };
            setPlan(nextPlan);
            upsertMealPlan(nextPlan);
          }}
        />
      </MoCard>

      <Text style={styles.title}>{meal.local_name}</Text>
      <Text style={styles.subtitle}>{meal.english_name}</Text>
      <Text style={styles.meta}>{meal.suggested_time} · {meal.prep_time_minutes} min · {meal.difficulty}</Text>

      <CoachMessageBubble feature="Nutrition" pose="nutrition" message={meal.why_this_meal} />

      <View style={styles.stack}>
        <PrePostMealCard phase="before" content={meal.pre_meal_action} />
        <PrePostMealCard phase="after" content={meal.post_meal_action} />
      </View>

      <View style={styles.tabRow}>
        {[
          { key: 'macros', label: 'Macros' },
          { key: 'micros', label: 'Micros' },
          { key: 'dishes', label: 'Dishes' },
          { key: 'ingredients', label: 'Ingredients' },
        ].map((item) => {
          const active = item.key === tab;
          return (
            <Pressable key={item.key} onPress={() => setTab(item.key as typeof tab)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'macros' ? (
        <MoCard>
          <MacroRing
            calories={meal.calories}
            calorieTarget={activeGoal.daily_calorie_target}
            protein={meal.protein_g}
            proteinTarget={activeGoal.protein_target_g}
            carbs={meal.carbs_g}
            carbsTarget={activeGoal.carbs_target_g}
            fat={meal.fat_g}
            fatTarget={activeGoal.fat_target_g}
          />
          <View style={styles.macroRows}>
            <Text style={styles.bodyMuted}>Calories {meal.calories} kcal</Text>
            <Text style={styles.bodyMuted}>Protein {meal.protein_g} g</Text>
            <Text style={styles.bodyMuted}>Carbohydrates {meal.carbs_g} g</Text>
            <Text style={styles.bodyMuted}>Fat {meal.fat_g} g</Text>
            <Text style={styles.bodyMuted}>Fiber {meal.fiber_g} g</Text>
            <Text style={styles.bodyMuted}>Sodium {meal.sodium_mg} mg</Text>
          </View>
        </MoCard>
      ) : null}

      {tab === 'micros' ? (
        <MoCard>
          <Text style={styles.helper}>Micronutrient estimates are based on foods that match the seeded regional database.</Text>
          <View style={styles.stack}>
            {nutrientSignals.map((nutrient) => (
              <NutrientRow key={nutrient.key} nutrient={nutrient} />
            ))}
          </View>
        </MoCard>
      ) : null}

      {tab === 'dishes' ? (
        <View style={styles.stack}>
          {meal.dishes.map((dish) => (
            <MealDetailCard key={`${dish.name}-${dish.quantity_g}`} dish={dish} />
          ))}
        </View>
      ) : null}

      {tab === 'ingredients' ? (
        <MoCard>
          <Text style={styles.sectionTitle}>What You Need</Text>
          <IngredientChecklist items={meal.ingredients_shopping} />
        </MoCard>
      ) : null}

      <MoButton onPress={() => navigation.navigate('MealLog', { planId: plan.id, mealSlot: meal.slot })}>Log This Meal</MoButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingVertical: theme.spacing.lg },
  title: { ...typography.display_md },
  subtitle: { ...typography.body_lg, color: colors.text_secondary, marginTop: theme.spacing.xs },
  meta: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.md },
  sectionTitle: { ...typography.body_xl, marginBottom: theme.spacing.sm },
  body: { ...typography.body_md },
  bodyMuted: { ...typography.body_sm, color: colors.text_secondary },
  helper: { ...typography.body_sm, color: colors.text_secondary, marginBottom: theme.spacing.md },
  tabRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md, flexWrap: 'wrap' },
  tab: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.full, backgroundColor: colors.bg_elevated },
  tabActive: { backgroundColor: colors.accent_green },
  tabText: { ...typography.body_sm },
  tabTextActive: { color: colors.text_inverse, fontFamily: theme.typography.bold },
  stack: { gap: theme.spacing.sm },
  macroRows: { gap: theme.spacing.xs, marginTop: theme.spacing.md },
});
