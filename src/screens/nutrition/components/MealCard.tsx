import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { MoButton } from '../../../components/common/MoButton';
import type { MealLog, PlannedMeal } from '../../../models';
import { colors, theme, typography } from '../../../theme';
import { formatMealSlot, getMealStatus } from '../../../utils/nutrition';

interface MealCardProps {
  meal: PlannedMeal;
  planDate: string;
  loggedMeal?: MealLog | null;
  onPressDetails: () => void;
  onPressLog: () => void;
  onPressImage: () => void;
}

export function MealCard({ meal, planDate, loggedMeal, onPressDetails, onPressLog, onPressImage }: MealCardProps) {
  const status = getMealStatus(meal, planDate, Boolean(loggedMeal));

  return (
    <View style={[styles.card, loggedMeal ? styles.cardLogged : styles.cardUnlogged]}>
      <Pressable onPress={onPressDetails} style={styles.pressable}>
        <View style={styles.header}>
          <View>
            <Text style={styles.time}>{meal.suggested_time || '--:--'} | {formatMealSlot(meal.slot)}</Text>
            <Text style={styles.localName}>{meal.local_name || meal.english_name}</Text>
            <Text style={styles.englishName}>{meal.english_name}</Text>
          </View>
          <View style={styles.statusWrap}>
            <View style={[styles.loggedBadge, !loggedMeal && styles.loggedBadgeHidden]}>
              <Text style={styles.loggedBadgeText}>Logged</Text>
            </View>
            <View style={[styles.status, { backgroundColor: status.color }]}>
              <Text style={styles.statusText}>{status.label}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.macros}>{meal.calories} kcal | {meal.protein_g}g P | {meal.carbs_g}g C | {meal.fat_g}g F</Text>
        <Text style={styles.actionText}>Before: {meal.pre_meal_action}</Text>
        <Text style={styles.actionText}>After: {meal.post_meal_action}</Text>
        <View style={styles.actions}>
          <MoButton size="small" onPress={onPressDetails} variant="secondary">View Details</MoButton>
          <MoButton size="small" onPress={onPressLog}>Log Meal</MoButton>
        </View>
        <MoButton size="small" onPress={onPressImage} variant="ghost">Generate Image</MoButton>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg_surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardLogged: {
    borderLeftWidth: 6,
    borderLeftColor: colors.accent_green,
  },
  cardUnlogged: {
    borderLeftWidth: 2,
    borderLeftColor: colors.border_subtle,
  },
  pressable: {
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  statusWrap: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.text_secondary,
    textTransform: 'capitalize',
  },
  localName: {
    ...typography.body_xl,
  },
  englishName: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
  status: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.text_inverse,
    fontFamily: theme.typography.bold,
  },
  loggedBadge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: colors.accent_green,
  },
  loggedBadgeHidden: {
    opacity: 0,
  },
  loggedBadgeText: {
    ...typography.caption,
    color: colors.text_inverse,
    fontFamily: theme.typography.bold,
  },
  macros: {
    ...typography.body_md,
  },
  actionText: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
