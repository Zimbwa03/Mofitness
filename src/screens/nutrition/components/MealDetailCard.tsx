import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type { PlannedDish } from '../../../models';
import { colors, theme, typography } from '../../../theme';

interface MealDetailCardProps {
  dish: PlannedDish;
}

export function MealDetailCard({ dish }: MealDetailCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{dish.local_name ?? dish.name}</Text>
      <Text style={styles.meta}>{dish.quantity_display}</Text>
      <Text style={styles.stats}>{dish.calories} kcal · {dish.protein_g}g P · {dish.carbs_g}g C · {dish.fat_g}g F</Text>
      <Text style={styles.body}>{dish.cooking_method}</Text>
      <Text style={styles.bodyMuted}>{dish.nutritional_benefit}</Text>
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
    gap: theme.spacing.xs,
  },
  title: {
    ...typography.body_xl,
  },
  meta: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  stats: {
    ...typography.body_sm,
  },
  body: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  bodyMuted: {
    ...typography.caption,
    color: colors.text_secondary,
  },
});
