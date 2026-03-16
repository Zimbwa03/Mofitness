import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type { MealAnalysisResult, PlannedMeal } from '../../../models';
import { colors, theme, typography } from '../../../theme';
import { AccuracyScoreBadge } from './AccuracyScoreBadge';

interface MealPhotoAnalyzerProps {
  analysis: MealAnalysisResult;
  targetMeal?: PlannedMeal | null;
  canPostToFeed: boolean;
}

export function MealPhotoAnalyzer({ analysis, targetMeal, canPostToFeed }: MealPhotoAnalyzerProps) {
  return (
    <View style={styles.card}>
      <AccuracyScoreBadge score={analysis.accuracy_score} confidence={analysis.confidence} animated />
      <Text style={styles.sectionTitle}>AI Identified</Text>
      {analysis.identified_dishes.map((dish) => (
        <Text key={`${dish.name}-${dish.quantity_est}`} style={styles.row}>
          {dish.name} | {dish.quantity_est} | {Math.round(dish.calories_est)} kcal | {dish.confidence}
        </Text>
      ))}
      <Text style={styles.sectionTitle}>Estimated Nutrition</Text>
      <Text style={styles.row}>
        {Math.round(analysis.total_calories_est)} kcal | {analysis.total_protein_g_est.toFixed(1)}g P | {analysis.total_carbs_g_est.toFixed(1)}g C | {analysis.total_fat_g_est.toFixed(1)}g F
      </Text>
      {targetMeal ? (
        <Text style={styles.helper}>
          Target: {targetMeal.calories} kcal | {targetMeal.protein_g}g P | {targetMeal.carbs_g}g C | {targetMeal.fat_g}g F
        </Text>
      ) : null}
      <Text style={styles.sectionTitle}>Analysis Notes</Text>
      <Text style={styles.helper}>Matched: {analysis.matched_items.join(', ') || 'None'}</Text>
      <Text style={styles.helper}>Missing: {analysis.missing_items.join(', ') || 'None'}</Text>
      <Text style={styles.helper}>Extra: {analysis.extra_items.join(', ') || 'None'}</Text>
      <Text style={styles.feedback}>{analysis.feedback}</Text>
      <Text style={[styles.eligibility, { color: canPostToFeed ? colors.accent_green : colors.accent_amber }]}>
        {analysis.feed_eligibility_reason}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...typography.body_md,
    fontFamily: theme.typography.bold,
    marginTop: theme.spacing.xs,
  },
  row: {
    ...typography.body_sm,
  },
  helper: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  feedback: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
  eligibility: {
    ...typography.body_sm,
    fontFamily: theme.typography.bold,
  },
});
