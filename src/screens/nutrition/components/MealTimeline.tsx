import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type { MealSlot, PlannedMeal } from '../../../models';
import { colors, theme, typography } from '../../../theme';
import { formatMealSlot, getMealStatus } from '../../../utils/nutrition';

interface MealTimelineProps {
  meals: PlannedMeal[];
  planDate: string;
  loggedSlots: MealSlot[];
}

export function MealTimeline({ meals, planDate, loggedSlots }: MealTimelineProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {meals.map((meal) => {
        const status = getMealStatus(meal, planDate, loggedSlots.includes(meal.slot));
        return (
          <View key={`${meal.slot}-${meal.suggested_time}`} style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: status.color }]} />
              <Text style={styles.time}>{meal.suggested_time}</Text>
            </View>
            <Text style={styles.label}>{formatMealSlot(meal.slot)}</Text>
            <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  card: {
    minWidth: 110,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    gap: theme.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  time: {
    ...typography.caption,
    color: colors.text_secondary,
  },
  label: {
    ...typography.body_md,
    textTransform: 'capitalize',
  },
  status: {
    ...typography.caption,
    fontFamily: theme.typography.bold,
  },
});
