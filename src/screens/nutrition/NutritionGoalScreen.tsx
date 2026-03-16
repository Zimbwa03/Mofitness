import { useEffect, useMemo, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoButton } from '../../components/common/MoButton';
import { MoCard } from '../../components/common/MoCard';
import { MoInput } from '../../components/common/MoInput';
import { useAuth } from '../../hooks/useAuth';
import type { NutritionGoalDraft, NutritionGoalType } from '../../models';
import type { NutritionStackParamList } from '../../navigation/types';
import nutritionAIService from '../../services/ai/NutritionAIService';
import nutritionService from '../../services/NutritionService';
import { useNutritionStore } from '../../stores/nutritionStore';
import { colors, layout, theme, typography } from '../../theme';
import { formatGoalType } from '../../utils/nutrition';
import { getScreenBottomPadding } from '../../utils/screen';

const GOAL_OPTIONS: Array<{ label: string; value: NutritionGoalType }> = [
  { label: 'Gain Weight', value: 'gain_weight' },
  { label: 'Lose Weight', value: 'lose_weight' },
  { label: 'Maintain', value: 'maintain_weight' },
  { label: 'Build Muscle', value: 'build_muscle' },
  { label: 'Cut Fat', value: 'cut_fat' },
  { label: 'Athletic', value: 'athletic_performance' },
  { label: 'General Health', value: 'general_health' },
  { label: 'Medical', value: 'medical_dietary' },
];

type Props = NativeStackScreenProps<NutritionStackParamList, 'NutritionGoal'>;

function parseList(text: string) {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumberOrNull(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value.trim().length > 0 ? parsed : null;
}

export function NutritionGoalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, profile, preferences } = useAuth();
  const setActiveGoal = useNutritionStore((state) => state.setActiveGoal);
  const upsertMealPlan = useNutritionStore((state) => state.upsertMealPlan);
  const setCountryCuisines = useNutritionStore((state) => state.setCountryCuisines);
  const countryCuisines = useNutritionStore((state) => state.countryCuisines);
  const [goalType, setGoalType] = useState<NutritionGoalType>('build_muscle');
  const [currentWeight, setCurrentWeight] = useState(String(profile?.weight_kg ?? 70));
  const [targetWeight, setTargetWeight] = useState(String(profile?.weight_kg ?? 72));
  const [targetBodyFat, setTargetBodyFat] = useState(profile?.body_fat_pct ? String(profile.body_fat_pct) : '');
  const [targetMuscleMass, setTargetMuscleMass] = useState('');
  const [targetDate, setTargetDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 42);
    return date;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [countryCode, setCountryCode] = useState(preferences.country_code ?? 'ZW');
  const [selectedCuisine, setSelectedCuisine] = useState<string[]>(preferences.cuisine_preferences ?? []);
  const [allergiesText, setAllergiesText] = useState((preferences.allergies ?? []).join(', '));
  const [dietaryRestrictionsText, setDietaryRestrictionsText] = useState((preferences.dietary_restrictions ?? []).join(', '));
  const [medicalConditionsText, setMedicalConditionsText] = useState(preferences.medical_conditions ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    nutritionService
      .getCountryCuisines()
      .then((rows) => setCountryCuisines(rows))
      .catch(() => undefined);
  }, [setCountryCuisines]);

  const activeCountry = useMemo(
    () => countryCuisines.find((row) => row.country_code === countryCode) ?? countryCuisines[0],
    [countryCode, countryCuisines],
  );

  useEffect(() => {
    if (activeCountry && selectedCuisine.length === 0) {
      setSelectedCuisine(activeCountry.cuisine_tags.slice(0, 3));
    }
  }, [activeCountry, selectedCuisine.length]);

  const usesWeightTarget = goalType === 'gain_weight' || goalType === 'lose_weight' || goalType === 'maintain_weight';
  const usesBodyFatTarget = goalType === 'cut_fat';
  const usesMuscleTarget = goalType === 'build_muscle';

  const draft = useMemo<NutritionGoalDraft | null>(() => {
    if (!profile) {
      return null;
    }

    return {
      goal_type: goalType,
      target_weight_kg: usesWeightTarget ? toNumberOrNull(targetWeight) : null,
      current_weight_kg: Number(currentWeight || profile.weight_kg || 70),
      target_body_fat_pct: usesBodyFatTarget ? toNumberOrNull(targetBodyFat) : null,
      target_muscle_mass_kg: usesMuscleTarget ? toNumberOrNull(targetMuscleMass) : null,
      target_date: targetDate.toISOString().slice(0, 10),
      meals_per_day: mealsPerDay,
      country_code: countryCode,
      cuisine_preference: selectedCuisine,
      allergies_snapshot: parseList(allergiesText),
      dietary_restrictions_snapshot: parseList(dietaryRestrictionsText),
      medical_conditions_snapshot: medicalConditionsText.trim(),
    };
  }, [allergiesText, countryCode, currentWeight, dietaryRestrictionsText, goalType, medicalConditionsText, mealsPerDay, profile, selectedCuisine, targetBodyFat, targetDate, targetMuscleMass, targetWeight, usesBodyFatTarget, usesMuscleTarget, usesWeightTarget]);

  const preview = useMemo(() => {
    if (!profile || !draft) {
      return null;
    }

    return nutritionAIService.buildGoalPreview(draft, profile);
  }, [draft, profile]);

  const validationMessage = useMemo(() => {
    if (!profile) {
      return 'User profile is required before creating a nutrition goal.';
    }

    if (!Number.isFinite(Number(currentWeight)) || Number(currentWeight) <= 0) {
      return 'Enter a valid current weight.';
    }

    if (usesWeightTarget && (!targetWeight.trim() || !Number.isFinite(Number(targetWeight)))) {
      return 'Enter a valid target weight for this goal.';
    }

    if (usesBodyFatTarget && (!targetBodyFat.trim() || !Number.isFinite(Number(targetBodyFat)))) {
      return 'Enter a valid target body fat percentage.';
    }

    if (usesMuscleTarget && (!targetMuscleMass.trim() || !Number.isFinite(Number(targetMuscleMass)))) {
      return 'Enter a valid target muscle mass.';
    }

    return null;
  }, [currentWeight, profile, targetBodyFat, targetMuscleMass, targetWeight, usesBodyFatTarget, usesMuscleTarget, usesWeightTarget]);

  const handleSave = async () => {
    if (!user || !profile || !draft || validationMessage) {
      if (validationMessage) {
        Alert.alert('Goal Setup Incomplete', validationMessage);
      }
      return;
    }

    setSaving(true);
    try {
      const goal = await nutritionService.saveGoal(user.id, draft);
      setActiveGoal(goal);
      const planDate = new Date().toISOString().slice(0, 10);
      const plan = await nutritionAIService.generateDailyMealPlan(planDate, goal.id);
      if (plan) {
        upsertMealPlan(plan);
      }
      navigation.replace('NutritionHome');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate your nutrition plan.';
      console.error('Failed to save nutrition goal', error);
      Alert.alert('Plan Generation Failed', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Your Nutrition Goal</Text>
      <Text style={styles.subtitle}>Set the target once. The day-by-day plan will adapt around it with meal timing, macros, and cuisine context.</Text>

      <MoCard>
        <Text style={styles.sectionTitle}>What do you want to achieve?</Text>
        <View style={styles.grid}>
          {GOAL_OPTIONS.map((option) => {
            const active = option.value === goalType;
            return (
              <Pressable key={option.value} onPress={() => setGoalType(option.value)} style={[styles.goalChip, active && styles.goalChipActive]}>
                <Text style={[styles.goalChipText, active && styles.goalChipTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>Target</Text>
        <View style={styles.weightRow}>
          <MoInput keyboardType="decimal-pad" label="Current Weight (kg)" onChangeText={setCurrentWeight} style={styles.weightInput} value={currentWeight} />
          {usesWeightTarget ? (
            <MoInput keyboardType="decimal-pad" label="Target Weight (kg)" onChangeText={setTargetWeight} style={styles.weightInput} value={targetWeight} />
          ) : null}
          {usesBodyFatTarget ? (
            <MoInput keyboardType="decimal-pad" label="Target Body Fat %" onChangeText={setTargetBodyFat} style={styles.weightInput} value={targetBodyFat} />
          ) : null}
          {usesMuscleTarget ? (
            <MoInput keyboardType="decimal-pad" label="Target Muscle Mass (kg)" onChangeText={setTargetMuscleMass} style={styles.weightInput} value={targetMuscleMass} />
          ) : null}
        </View>
        {usesWeightTarget && Number.isFinite(Number(currentWeight)) && Number.isFinite(Number(targetWeight)) ? (
          <Text style={styles.deltaText}>
            {Number(targetWeight) - Number(currentWeight) >= 0 ? '+' : ''}
            {(Number(targetWeight) - Number(currentWeight)).toFixed(1)} kg from current baseline
          </Text>
        ) : null}
        <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
          <Text style={styles.dateLabel}>Target Date</Text>
          <Text style={styles.dateValue}>{targetDate.toDateString()}</Text>
        </Pressable>
        {showDatePicker ? (
          <DateTimePicker
            value={targetDate}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, value) => {
              setShowDatePicker(false);
              if (value) {
                setTargetDate(value);
              }
            }}
          />
        ) : null}
      </MoCard>

      <MoCard variant="highlight">
        <Text style={styles.sectionTitle}>Goal Pace Summary</Text>
        <Text style={styles.summaryLine}>{preview?.daysToGoal ?? 0} days · {preview?.weeksToGoal ?? 0} weeks</Text>
        <Text style={styles.summarySub}>{preview?.targetSummary ?? 'No target summary yet.'}</Text>
        <Text style={styles.summarySub}>{preview?.paceSummary ?? 'Set a target to preview the pace.'}</Text>
        <Text style={styles.summarySub}>
          {preview ? `${preview.dailyCalorieDelta >= 0 ? 'Daily surplus' : 'Daily deficit'} ${Math.abs(preview.dailyCalorieDelta)} kcal · Estimated protein ${preview.targets.protein_g}g` : 'Daily macro targets will appear here.'}
        </Text>
      </MoCard>

      {preview?.warnings.length ? (
        <MoCard variant="amber">
          <Text style={styles.sectionTitle}>Mo's Safety Review</Text>
          <View style={styles.stack}>
            {preview.warnings.map((warning) => (
              <Text key={warning} style={styles.warningText}>• {warning}</Text>
            ))}
          </View>
        </MoCard>
      ) : null}

      <MoCard>
        <Text style={styles.sectionTitle}>Meals Per Day</Text>
        <View style={styles.pillRow}>
          {[1, 2, 3, 4, 5, 6].map((value) => (
            <Pressable key={value} onPress={() => setMealsPerDay(value)} style={[styles.pill, mealsPerDay === value && styles.pillActive]}>
              <Text style={[styles.pillText, mealsPerDay === value && styles.pillTextActive]}>{value}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.recommendation}>
          Mo recommends {preview?.recommendedMealsPerDay ?? mealsPerDay} meals/day. {preview?.recommendationReason ?? 'Meal spacing guidance will appear here.'}
        </Text>
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>Country and Cuisine</Text>
        <View style={styles.grid}>
          {countryCuisines.map((row) => {
            const active = row.country_code === countryCode;
            return (
              <Pressable key={row.country_code} onPress={() => setCountryCode(row.country_code)} style={[styles.goalChip, active && styles.goalChipActive]}>
                <Text style={[styles.goalChipText, active && styles.goalChipTextActive]}>{row.country_name}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Preferred Cuisines</Text>
        <View style={styles.grid}>
          {(activeCountry?.cuisine_tags ?? []).map((tag) => {
            const active = selectedCuisine.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => setSelectedCuisine((current) => (active ? current.filter((item) => item !== tag) : [...current, tag]))}
                style={[styles.goalChip, active && styles.goalChipActive]}
              >
                <Text style={[styles.goalChipText, active && styles.goalChipTextActive]}>{formatGoalType(tag)}</Text>
              </Pressable>
            );
          })}
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>Restrictions Review</Text>
        <Text style={styles.helper}>Carry forward your onboarding restrictions, then adjust anything that has changed.</Text>
        <View style={styles.stack}>
          <MoInput label="Allergies (comma separated)" onChangeText={setAllergiesText} value={allergiesText} />
          <MoInput label="Dietary Restrictions (comma separated)" onChangeText={setDietaryRestrictionsText} value={dietaryRestrictionsText} />
          <MoInput label="Medical Conditions" onChangeText={setMedicalConditionsText} value={medicalConditionsText} multiline placeholder="Optional notes for conservative goal handling" />
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>Daily Targets</Text>
        <Text style={styles.summaryLine}>
          {preview?.targets.dailyCalorieTarget ?? 0} kcal · {preview?.targets.protein_g ?? 0}g protein · {preview?.targets.carbs_g ?? 0}g carbs · {preview?.targets.fat_g ?? 0}g fat
        </Text>
        <Text style={styles.summarySub}>
          Water {preview?.targets.water_min_liters?.toFixed(1) ?? '0.0'}-{preview?.targets.water_max_liters?.toFixed(1) ?? '0.0'}L · Fiber {preview?.targets.fiber_g ?? 0}g · Sodium {preview?.targets.sodium_mg ?? 0}mg
        </Text>
      </MoCard>

      {validationMessage ? <Text style={styles.validation}>{validationMessage}</Text> : null}

      <MoButton loading={saving} onPress={() => void handleSave()}>
        Generate My Nutrition Plan
      </MoButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingVertical: theme.spacing.lg },
  title: { ...typography.display_md, marginBottom: theme.spacing.sm },
  subtitle: { ...typography.body_md, color: colors.text_secondary, marginBottom: theme.spacing.lg },
  sectionTitle: { ...typography.body_xl, marginBottom: theme.spacing.sm },
  helper: { ...typography.body_sm, color: colors.text_secondary, marginBottom: theme.spacing.md },
  stack: { gap: theme.spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  goalChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  goalChipActive: { borderColor: colors.accent_green, backgroundColor: 'rgba(200,241,53,0.12)' },
  goalChipText: { ...typography.body_sm, color: colors.text_primary, textTransform: 'capitalize' },
  goalChipTextActive: { color: colors.accent_green },
  weightRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  weightInput: { flex: 1, minWidth: 140 },
  deltaText: { ...typography.body_sm, color: colors.accent_green, marginTop: theme.spacing.sm },
  dateButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  dateLabel: { ...typography.caption, color: colors.text_secondary },
  dateValue: { ...typography.body_md, marginTop: theme.spacing.xs },
  summaryLine: { ...typography.body_lg, color: colors.accent_green },
  summarySub: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.xs },
  warningText: { ...typography.body_sm, color: colors.text_secondary },
  pillRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  pill: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  pillActive: { backgroundColor: colors.accent_green, borderColor: colors.accent_green },
  pillText: { ...typography.body_lg },
  pillTextActive: { color: colors.text_inverse, fontFamily: theme.typography.bold },
  recommendation: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.md },
  sectionSpacing: { marginTop: theme.spacing.md },
  validation: { ...typography.body_sm, color: colors.accent_red, marginBottom: theme.spacing.md },
});
