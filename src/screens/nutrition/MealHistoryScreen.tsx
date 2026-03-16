import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoCard } from '../../components/common/MoCard';
import { useAuth } from '../../hooks/useAuth';
import nutritionService from '../../services/NutritionService';
import { useNutritionStore } from '../../stores/nutritionStore';
import { colors, layout, theme, typography } from '../../theme';
import { getScreenBottomPadding } from '../../utils/screen';
import { NutritionChart } from './components/NutritionChart';

export function MealHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const mealPlans = useNutritionStore((state) => state.mealPlans);
  const setMealPlans = useNutritionStore((state) => state.setMealPlans);
  const mealLogs = useNutritionStore((state) => state.mealLogs);
  const setMealLogs = useNutritionStore((state) => state.setMealLogs);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [weightSeries, setWeightSeries] = useState<Array<{ x: string; y: number }>>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    nutritionService.getPlans(user.id).then((rows) => setMealPlans(rows)).catch(() => undefined);
    nutritionService.getMealLogs(user.id).then((rows) => setMealLogs(rows)).catch(() => undefined);
    nutritionService.getBodyMetricLogs(user.id)
      .then((rows) => {
        setWeightSeries(rows.filter((row) => typeof row.weight_kg === 'number').slice(0, 8).reverse().map((row) => ({
          x: row.log_date.slice(5),
          y: Number(row.weight_kg ?? 0),
        })));
      })
      .catch(() => undefined);
  }, [setMealLogs, setMealPlans, user]);

  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const cutoff = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }, [days]);

  const scopedPlans = mealPlans.filter((row) => row.plan_date >= cutoff);
  const scopedLogs = mealLogs.filter((row) => row.log_date >= cutoff);
  const calorieTrend = scopedLogs.slice(0, 7).reverse().map((row) => ({ x: row.log_date.slice(5), y: Number(row.total_calories ?? 0) }));
  const macroTrend = scopedLogs.slice(0, 7).reverse().map((row) => ({ x: row.log_date.slice(5), y: Number(row.total_protein_g ?? 0) }));
  const accuracyTrend = scopedLogs.filter((row) => typeof row.ai_accuracy_score === 'number').slice(0, 7).reverse().map((row) => ({ x: row.log_date.slice(5), y: Number(row.ai_accuracy_score ?? 0) }));
  const avgCalories = scopedLogs.length > 0 ? Math.round(scopedLogs.reduce((sum, row) => sum + Number(row.total_calories ?? 0), 0) / scopedLogs.length) : 0;
  const adherence = scopedPlans.length > 0
    ? Math.round((scopedLogs.reduce((sum, row) => sum + Number(row.total_protein_g ?? 0), 0) /
        Math.max(1, scopedPlans.reduce((sum, row) => sum + Number(row.total_protein_g ?? 0), 0))) * 100)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.periodRow}>
        {[
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
          { label: 'All Time', value: 'all' },
        ].map((item) => {
          const active = item.value === period;
          return (
            <Text key={item.value} onPress={() => setPeriod(item.value as typeof period)} style={[styles.periodChip, active && styles.periodChipActive]}>
              {item.label}
            </Text>
          );
        })}
      </View>

      <View style={styles.summaryRow}>
        <MoCard style={styles.summaryCard}><Text style={styles.summaryValue}>{avgCalories}</Text><Text style={styles.summaryLabel}>Avg Calories</Text></MoCard>
        <MoCard style={styles.summaryCard}><Text style={styles.summaryValue}>{adherence}%</Text><Text style={styles.summaryLabel}>Protein Adherence</Text></MoCard>
        <MoCard style={styles.summaryCard}><Text style={styles.summaryValue}>{scopedLogs.length}</Text><Text style={styles.summaryLabel}>Meal Logs</Text></MoCard>
      </View>

      <NutritionChart title="Calorie Trend" mode="bar" data={calorieTrend.length ? calorieTrend : [{ x: 'Now', y: 0 }]} />
      <NutritionChart title="Protein Trend" mode="bar" data={macroTrend.length ? macroTrend : [{ x: 'Now', y: 0 }]} />
      <NutritionChart title="Weight Progress" mode="line" data={weightSeries.length ? weightSeries : [{ x: 'Now', y: 0 }]} />
      <NutritionChart title="Accuracy Score Trend" mode="line" data={accuracyTrend.length ? accuracyTrend : [{ x: 'Now', y: 0 }]} />

      <MoCard>
        <Text style={styles.historyTitle}>Past Meal Logs</Text>
        {scopedLogs.map((row) => (
          <View key={row.id} style={styles.historyRow}>
            <View>
              <Text style={styles.historyMeal}>{row.meal_name ?? row.meal_slot}</Text>
              <Text style={styles.historyMeta}>{row.log_date} · {row.total_calories ?? 0} kcal</Text>
            </View>
            <Text style={styles.historyMeta}>{Math.round(row.ai_accuracy_score ?? 0)}%</Text>
          </View>
        ))}
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingVertical: theme.spacing.lg },
  periodRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md, flexWrap: 'wrap' },
  periodChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: colors.bg_elevated,
    overflow: 'hidden',
  },
  periodChipActive: { backgroundColor: colors.accent_green, color: colors.text_inverse },
  summaryRow: { flexDirection: 'row', gap: theme.spacing.sm },
  summaryCard: { flex: 1 },
  summaryValue: { ...typography.display_sm, color: colors.accent_green },
  summaryLabel: { ...typography.caption, color: colors.text_secondary },
  historyTitle: { ...typography.body_xl, marginBottom: theme.spacing.md },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border_subtle },
  historyMeal: { ...typography.body_md },
  historyMeta: { ...typography.body_sm, color: colors.text_secondary },
});
