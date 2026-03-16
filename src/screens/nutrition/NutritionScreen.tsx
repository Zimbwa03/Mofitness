import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachFullPanel } from '../../components/coach/CoachFullPanel';
import { CoachMessageBubble } from '../../components/coach/CoachMessageBubble';
import { MoButton } from '../../components/common/MoButton';
import { MoCard } from '../../components/common/MoCard';
import { useAuth } from '../../hooks/useAuth';
import type { MealSlot } from '../../models';
import type { NutritionStackParamList } from '../../navigation/types';
import mealImageGenService from '../../services/ai/MealImageGenService';
import nutritionAIService from '../../services/ai/NutritionAIService';
import nutritionService from '../../services/NutritionService';
import waterService from '../../services/WaterService';
import { useOfflineQueueStore } from '../../stores/offlineQueueStore';
import { useNutritionStore } from '../../stores/nutritionStore';
import { colors, layout, theme, typography } from '../../theme';
import { buildPlanNutrientSignals, formatGoalType } from '../../utils/nutrition';
import { getTabScreenBottomPadding } from '../../utils/screen';
import { GoalCountdown } from './components/GoalCountdown';
import { MacroRing } from './components/MacroRing';
import { MealCard } from './components/MealCard';
import { MealTimeline } from './components/MealTimeline';
import { NutrientRow } from './components/NutrientRow';
import { NutritionCookingLoader } from './components/NutritionCookingLoader';
import { OfflineStateBanner } from './components/OfflineStateBanner';
import { PendingSyncBanner } from './components/PendingSyncBanner';
import { WaterTracker } from './components/WaterTracker';

type Props = NativeStackScreenProps<NutritionStackParamList, 'NutritionHome'>;

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatLabel(date: Date) {
  return `${date.getDate()}`;
}

export function NutritionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const activeGoal = useNutritionStore((state) => state.activeGoal);
  const setActiveGoal = useNutritionStore((state) => state.setActiveGoal);
  const selectedDate = useNutritionStore((state) => state.selectedDate);
  const setSelectedDate = useNutritionStore((state) => state.setSelectedDate);
  const mealPlans = useNutritionStore((state) => state.mealPlans);
  const upsertMealPlan = useNutritionStore((state) => state.upsertMealPlan);
  const mealLogs = useNutritionStore((state) => state.mealLogs);
  const setMealLogs = useNutritionStore((state) => state.setMealLogs);
  const waterLogs = useNutritionStore((state) => state.waterLogs);
  const setWaterLogs = useNutritionStore((state) => state.setWaterLogs);
  const setLoading = useNutritionStore((state) => state.setLoading);
  const nutritionHomeLoading = useNutritionStore((state) => state.loading['nutrition-home'] ?? false);
  const countryCuisines = useNutritionStore((state) => state.countryCuisines);
  const regionalFoods = useNutritionStore((state) => state.regionalFoods);
  const setRegionalFoods = useNutritionStore((state) => state.setRegionalFoods);
  const pendingSyncCount = useOfflineQueueStore((state) => state.pendingCount);
  const [planSource, setPlanSource] = useState<'remote' | 'cache' | 'none'>('none');
  const [planSourceReason, setPlanSourceReason] = useState<'connectivity' | 'local_cache' | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading('nutrition-home', true);
    try {
      const goal = await nutritionService.getActiveGoal(user.id);
      setActiveGoal(goal ?? null);
      if (!goal) {
        return;
      }

      const existingPlan = mealPlans.find((row) => row.plan_date === selectedDate) ?? undefined;
      const planRead = await nutritionService.getPlanForDateWithStatus(user.id, selectedDate);
      let plan = planRead.data ?? existingPlan;
      if (!plan) {
        plan = (await nutritionAIService.generateDailyMealPlan(selectedDate, goal.id)) ?? undefined;
        setPlanSource('remote');
        setPlanSourceReason(null);
      } else {
        setPlanSource(planRead.source);
        setPlanSourceReason(planRead.reason);
      }
      if (plan) {
        upsertMealPlan(plan);
      }

      const [logs, hydration, foods] = await Promise.all([
        nutritionService.getMealLogs(user.id, selectedDate),
        nutritionService.getWaterLogs(user.id, selectedDate),
        regionalFoods.length > 0 ? Promise.resolve(regionalFoods) : nutritionService.getRegionalFoods(goal.country_code),
      ]);
      setMealLogs(logs);
      setWaterLogs(hydration);
      if (regionalFoods.length === 0) {
        setRegionalFoods(foods);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load nutrition data.';
      console.error('Failed to load nutrition screen', error);
      Alert.alert('Nutrition Unavailable', message);
    } finally {
      setLoading('nutrition-home', false);
    }
  }, [mealPlans, regionalFoods, selectedDate, setActiveGoal, setLoading, setMealLogs, setRegionalFoods, setWaterLogs, upsertMealPlan, user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const todayPlan = mealPlans.find((row) => row.plan_date === selectedDate) ?? null;
  const todaysLogs = mealLogs.filter((row) => row.log_date === selectedDate);
  const hydrationMl = waterLogs.filter((row) => row.log_date === selectedDate).reduce((sum, row) => sum + row.amount_ml, 0);
  const loggedSlots = todaysLogs.map((row) => row.meal_slot) as MealSlot[];

  const loggedMacros = useMemo(
    () =>
      todaysLogs.reduce(
        (acc, log) => ({
          calories: acc.calories + Number(log.total_calories ?? 0),
          protein: acc.protein + Number(log.total_protein_g ?? 0),
          carbs: acc.carbs + Number(log.total_carbs_g ?? 0),
          fat: acc.fat + Number(log.total_fat_g ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [todaysLogs],
  );

  const nutrientSignals = useMemo(() => {
    if (!todayPlan) {
      return [];
    }

    return buildPlanNutrientSignals(
      todayPlan,
      regionalFoods,
      activeGoal?.fiber_target_g ?? 30,
      activeGoal?.sodium_target_mg ?? 2300,
    );
  }, [activeGoal?.fiber_target_g, activeGoal?.sodium_target_mg, regionalFoods, todayPlan]);

  const dateStrip = useMemo(() => {
    const base = new Date(`${selectedDate}T08:00:00`);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(base);
      date.setDate(base.getDate() - 3 + index);
      return date;
    });
  }, [selectedDate]);

  const targetWater = activeGoal ? (activeGoal.water_target_min_liters + activeGoal.water_target_max_liters) / 2 : 3;

  const handleAddWater = async (amountMl: number) => {
    if (!user) {
      return;
    }

    const waterLog = await waterService.addWaterLog(user.id, selectedDate, amountMl);
    setWaterLogs([waterLog, ...waterLogs]);
  };

  const handleGenerateImage = async (mealSlot: string) => {
    if (!todayPlan || !activeGoal) {
      return;
    }

    const meal = todayPlan.meals.find((row) => row.slot === mealSlot);
    if (!meal) {
      return;
    }

    try {
      const result = await mealImageGenService.generateMealImage({
        meal,
        countryCode: activeGoal.country_code,
        countryName: countryCuisines.find((row) => row.country_code === activeGoal.country_code)?.country_name ?? activeGoal.country_code,
        planId: todayPlan.id,
      });

      upsertMealPlan({ ...todayPlan, generated_image_url: result?.imageUrl ?? todayPlan.generated_image_url });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate the meal image.';
      console.error('Failed to generate meal image', error);
      Alert.alert('Meal Image Failed', message);
    }
  };

  if (!activeGoal) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: getTabScreenBottomPadding(insets.bottom) }]}>
        <MoCard variant="highlight">
          <CoachMessageBubble
            feature="Meal Plan"
            pose="nutrition"
            message="No meal plan yet. Let me build today's nutrition around your goal."
          />
          <Text style={styles.emptyTitle}>No nutrition goal yet</Text>
          <Text style={styles.emptyBody}>Set a goal first so Mofitness can build daily targets, local meals, hydration, and meal logging around it.</Text>
          <MoButton onPress={() => navigation.navigate('NutritionGoal')}>Set Nutrition Goal</MoButton>
        </MoCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getTabScreenBottomPadding(insets.bottom) }]}
      showsVerticalScrollIndicator={false}
    >
      <MoCard variant="amber">
        <GoalCountdown
          currentWeightKg={activeGoal.current_weight_kg}
          targetWeightKg={activeGoal.target_weight_kg}
          targetDate={activeGoal.target_date}
          goalLabel={formatGoalType(activeGoal.goal_type)}
          dayNumber={todayPlan?.day_number}
        />
      </MoCard>

      <View style={styles.topActions}>
        <MoButton size="small" onPress={() => navigation.navigate('NutritionGoal')} variant="secondary" style={styles.topActionButton}>Edit Goal</MoButton>
        <MoButton size="small" onPress={() => navigation.navigate('MealHistory')} variant="secondary" style={styles.topActionButton}>History</MoButton>
      </View>

      <PendingSyncBanner count={pendingSyncCount} body="Queued meal logs and feed actions will sync automatically once Mofitness can reach the server again." />
      <CoachFullPanel
        feature="Meal Plan"
        pose="nutrition"
        message={`Here is your nutrition plan for ${selectedDate}. Keep your portions consistent and hydration steady for better recovery.`}
      />

      {planSource === 'cache' ? (
        <OfflineStateBanner
          title="Showing a saved meal plan"
          body={
            planSourceReason === 'connectivity'
              ? 'You appear to be offline, so this screen is using the last meal plan stored on this device.'
              : 'This date is currently using a meal plan already stored on this device.'
          }
        />
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
        {dateStrip.map((date) => {
          const key = dateKey(date);
          const isActive = key === selectedDate;
          const isToday = key === new Date().toISOString().slice(0, 10);
          return (
            <Pressable key={key} onPress={() => setSelectedDate(key)} style={[styles.dateChip, isActive && styles.dateChipActive]}>
              <Text style={[styles.dateChipText, isActive && styles.dateChipTextActive]}>{formatLabel(date)}</Text>
              {isToday ? <Text style={[styles.todayChip, isActive && styles.dateChipTextActive]}>Today</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {todayPlan ? (
        <MoCard>
          <Text style={styles.sectionTitle}>Meal Timeline</Text>
          <MealTimeline meals={todayPlan.meals} planDate={todayPlan.plan_date} loggedSlots={loggedSlots} />
        </MoCard>
      ) : null}

      <MoCard>
        <MacroRing
          calories={loggedMacros.calories}
          calorieTarget={activeGoal.daily_calorie_target}
          protein={loggedMacros.protein}
          proteinTarget={activeGoal.protein_target_g}
          carbs={loggedMacros.carbs}
          carbsTarget={activeGoal.carbs_target_g}
          fat={loggedMacros.fat}
          fatTarget={activeGoal.fat_target_g}
        />
      </MoCard>

      <MoCard>
        <WaterTracker
          totalMl={hydrationMl}
          targetLiters={targetWater}
          onAdd250={() => void handleAddWater(250)}
          onAdd500={() => void handleAddWater(500)}
        />
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>Today's Key Nutrients</Text>
        <Text style={styles.supporting}>These estimates are built from matched regional foods and the meal plan structure.</Text>
        <View style={styles.nutrientStack}>
          {nutrientSignals.map((nutrient) => (
            <NutrientRow key={nutrient.key} nutrient={nutrient} />
          ))}
        </View>
      </MoCard>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Meal Plan</Text>
        <Text style={styles.supporting}>{todayPlan ? `${todayPlan.meals.length} meals` : 'No plan yet'}</Text>
      </View>

      <View style={styles.mealList}>
        {todayPlan ? (
          todayPlan.meals.map((meal) => (
            <MealCard
              key={meal.slot}
              meal={meal}
              planDate={todayPlan.plan_date}
              loggedMeal={todaysLogs.find((row) => row.meal_slot === meal.slot) ?? null}
              onPressDetails={() => navigation.navigate('MealDetail', { planId: todayPlan.id, mealSlot: meal.slot })}
              onPressLog={() => navigation.navigate('MealLog', { planId: todayPlan.id, mealSlot: meal.slot })}
              onPressImage={() => void handleGenerateImage(meal.slot)}
            />
          ))
        ) : nutritionHomeLoading ? (
          <NutritionCookingLoader />
        ) : (
          <MoCard>
            <Text style={styles.emptyBody}>No meal plan has been generated for this date yet.</Text>
            <MoButton onPress={() => navigation.navigate('MealPlanGenerator', { planDate: selectedDate })} size="small">
              Generate Meal Plan
            </MoButton>
          </MoCard>
        )}
      </View>

      <MoCard variant="glass">
        <Text style={styles.sectionTitle}>Mo's Nutrition Note</Text>
        <Text style={styles.note}>
          {todayPlan?.ai_notes ??
            nutritionAIService.getDailyNutritionCoaching(
              {
                calories: loggedMacros.calories,
                protein_g: loggedMacros.protein,
                carbs_g: loggedMacros.carbs,
                fat_g: loggedMacros.fat,
                water_liters: hydrationMl / 1000,
              },
              {
                dailyCalorieTarget: activeGoal.daily_calorie_target,
                protein_g: activeGoal.protein_target_g,
                carbs_g: activeGoal.carbs_target_g,
                fat_g: activeGoal.fat_target_g,
                fiber_g: activeGoal.fiber_target_g,
                sodium_mg: activeGoal.sodium_target_mg,
                water_min_liters: activeGoal.water_target_min_liters,
                water_max_liters: activeGoal.water_target_max_liters,
              },
            )}
        </Text>
      </MoCard>

      <View style={styles.quickActions}>
        <MoButton onPress={() => navigation.navigate('MealLog')} style={styles.quickActionButton}>Log A Meal</MoButton>
        <MoButton onPress={() => navigation.navigate('MealPlanGenerator', { planDate: selectedDate })} variant="secondary" style={styles.quickActionButton}>Regenerate Today</MoButton>
      </View>
      <MoButton onPress={() => navigation.navigate('HealthFeed')} variant="amber">
        Health Feed
      </MoButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingVertical: theme.spacing.lg },
  emptyTitle: { ...typography.display_sm, marginBottom: theme.spacing.sm },
  emptyBody: { ...typography.body_md, color: colors.text_secondary, marginBottom: theme.spacing.md },
  topActions: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  topActionButton: { flex: 1 },
  dateStrip: { gap: theme.spacing.sm, paddingBottom: theme.spacing.md },
  dateChip: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    gap: 2,
  },
  dateChipActive: {
    backgroundColor: colors.accent_green,
    borderColor: colors.accent_green,
  },
  dateChipText: { ...typography.body_md },
  dateChipTextActive: { color: colors.text_inverse, fontFamily: theme.typography.bold },
  todayChip: { ...typography.caption, color: colors.text_secondary },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: theme.spacing.sm },
  sectionTitle: { ...typography.body_xl },
  supporting: { ...typography.body_sm, color: colors.text_secondary },
  nutrientStack: { gap: theme.spacing.md, marginTop: theme.spacing.md },
  mealList: { gap: theme.spacing.md },
  note: { ...typography.body_md, color: colors.text_secondary },
  quickActions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm },
  quickActionButton: { flex: 1 },
});
