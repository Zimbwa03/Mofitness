import { useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachMessageBubble } from '../../components/coach/CoachMessageBubble';
import { ThinkingLoader } from '../../components/coach/ThinkingLoader';
import { MoButton } from '../../components/common/MoButton';
import { MoCard } from '../../components/common/MoCard';
import { useAuth } from '../../hooks/useAuth';
import type { NutritionStackParamList } from '../../navigation/types';
import nutritionAIService from '../../services/ai/NutritionAIService';
import nutritionService from '../../services/NutritionService';
import { useNutritionStore } from '../../stores/nutritionStore';
import { colors, layout, theme, typography } from '../../theme';
import { formatGoalType } from '../../utils/nutrition';
import { getScreenBottomPadding } from '../../utils/screen';
import { NutritionCookingLoader } from './components/NutritionCookingLoader';

type Props = NativeStackScreenProps<NutritionStackParamList, 'MealPlanGenerator'>;

export function MealPlanGeneratorScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const activeGoal = useNutritionStore((state) => state.activeGoal);
  const setActiveGoal = useNutritionStore((state) => state.setActiveGoal);
  const mealPlans = useNutritionStore((state) => state.mealPlans);
  const upsertMealPlan = useNutritionStore((state) => state.upsertMealPlan);
  const setSelectedDate = useNutritionStore((state) => state.setSelectedDate);
  const [selectedDate, setSelectedDateState] = useState(() => route.params?.planDate ?? new Date().toISOString().slice(0, 10));
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const existingPlan = mealPlans.find((plan) => plan.plan_date === selectedDate) ?? null;
  const countdown = useMemo(() => {
    if (!activeGoal) {
      return null;
    }

    const days = Math.max(0, Math.ceil((new Date(activeGoal.target_date).getTime() - Date.now()) / 86_400_000));
    return days;
  }, [activeGoal]);

  const handleGenerate = async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    try {
      let goal = activeGoal;
      if (!goal) {
        goal = await nutritionService.getActiveGoal(user.id);
        setActiveGoal(goal);
      }

      if (!goal) {
        navigation.replace('NutritionGoal');
        return;
      }

      const savedPlan = await nutritionService.getPlanForDate(user.id, selectedDate);
      const plan = savedPlan ?? (await nutritionAIService.generateDailyMealPlan(selectedDate, goal.id));
      if (plan) {
        upsertMealPlan(plan);
        setSelectedDate(selectedDate);
      }
      navigation.replace('NutritionHome');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to build the meal plan.';
      Alert.alert('Meal Plan Failed', message);
    } finally {
      setLoading(false);
    }
  };

  if (!activeGoal) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}>
        <MoCard>
          <CoachMessageBubble
            feature="Meal Plan"
            pose="nutrition"
            message="Set your goal first and I will generate meal plans matched to your targets and cuisine."
          />
          <Text style={styles.title}>No active nutrition goal</Text>
          <Text style={styles.body}>Create a nutrition goal first so the generator has targets, cuisine preferences, and a timeline.</Text>
          <MoButton onPress={() => navigation.replace('NutritionGoal')}>Set Nutrition Goal</MoButton>
        </MoCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Meal Plan Generator</Text>
      <Text style={styles.body}>Choose a day and rebuild the nutrition plan around your active goal.</Text>
      <CoachMessageBubble
        feature="Meal Plan"
        pose="nutrition"
        message="Pick a date and I will build or load the best meal plan for that day."
      />

      <MoCard variant="highlight">
        <Text style={styles.sectionTitle}>Active Goal</Text>
        <Text style={styles.goalLabel}>{formatGoalType(activeGoal.goal_type)}</Text>
        <Text style={styles.helper}>Target date: {activeGoal.target_date} | {countdown ?? 0} days remaining</Text>
        <Text style={styles.helper}>
          {activeGoal.daily_calorie_target} kcal | {activeGoal.protein_target_g}g protein | {activeGoal.carbs_target_g}g carbs | {activeGoal.fat_target_g}g fat
        </Text>
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>Plan Date</Text>
        <Pressable onPress={() => setShowPicker(true)} style={styles.dateButton}>
          <Text style={styles.dateLabel}>Selected date</Text>
          <Text style={styles.dateValue}>{selectedDate}</Text>
        </Pressable>
        {showPicker ? (
          <DateTimePicker
            value={new Date(`${selectedDate}T08:00:00`)}
            mode="date"
            onChange={(_, value) => {
              setShowPicker(false);
              if (value) {
                setSelectedDateState(value.toISOString().slice(0, 10));
              }
            }}
          />
        ) : null}
        {existingPlan ? <Text style={styles.notice}>A plan already exists for this date. Mofitness will load the saved version instead of generating a duplicate.</Text> : null}
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>Generation Rules</Text>
        <View style={styles.stack}>
          <Text style={styles.helper}>- Meal timing follows your current meals-per-day target.</Text>
          <Text style={styles.helper}>- Country and cuisine preferences stay attached to the plan.</Text>
          <Text style={styles.helper}>- Existing plans are reused before any new AI generation runs.</Text>
        </View>
      </MoCard>

      {loading ? (
        <View style={styles.loadingStack}>
          <ThinkingLoader />
          <NutritionCookingLoader />
        </View>
      ) : null}

      <MoButton loading={loading} onPress={() => void handleGenerate()}>
        {existingPlan ? 'Load Saved Plan' : 'Generate Meal Plan'}
      </MoButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingVertical: theme.spacing.lg },
  title: { ...typography.display_md, marginBottom: theme.spacing.sm },
  body: { ...typography.body_md, color: colors.text_secondary, marginBottom: theme.spacing.lg },
  sectionTitle: { ...typography.body_xl, marginBottom: theme.spacing.sm },
  goalLabel: { ...typography.display_sm, color: colors.accent_green, textTransform: 'capitalize' },
  helper: { ...typography.body_sm, color: colors.text_secondary },
  dateButton: {
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  dateLabel: { ...typography.caption, color: colors.text_secondary },
  dateValue: { ...typography.body_lg, marginTop: theme.spacing.xs },
  notice: { ...typography.body_sm, color: colors.accent_amber },
  stack: { gap: theme.spacing.sm },
  loadingStack: { gap: theme.spacing.md },
});
