import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { MacroPieChart } from '../../../components/charts/MacroPieChart';
import { colors, theme, typography } from '../../../theme';

interface MacroRingProps {
  calories: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
}

interface MacroStatCardProps {
  label: string;
  value: number;
  target: number;
}

function MacroStatCard({ label, value, target }: MacroStatCardProps) {
  const pct = Math.max(0, Math.round((value / Math.max(1, target)) * 100));
  const fillRatio = Math.min(pct, 100) / 100;

  return (
    <View style={styles.box}>
      <Text style={styles.value}>{Math.round(value)}g</Text>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { transform: [{ scaleX: fillRatio }] }]} />
      </View>
      <Text style={styles.pct}>{pct}%</Text>
    </View>
  );
}

export function MacroRing({
  calories,
  calorieTarget,
  protein,
  proteinTarget,
  carbs,
  carbsTarget,
  fat,
  fatTarget,
}: MacroRingProps) {
  const macroRows = [
    { label: 'Protein', value: protein, target: proteinTarget },
    { label: 'Carbs', value: carbs, target: carbsTarget },
    { label: 'Fat', value: fat, target: fatTarget },
  ];
  return (
    <View>
      <MacroPieChart carbs={carbs} protein={protein} fat={fat} />
      <View style={styles.centerText}>
        <Text style={styles.calories}>{Math.round(calories)} / {Math.round(calorieTarget)}</Text>
        <Text style={styles.caption}>kcal</Text>
      </View>
      <View style={styles.row}>
        {macroRows.map((row) => (
          <MacroStatCard key={row.label} label={row.label} value={row.value} target={row.target} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerText: {
    alignItems: 'center',
    marginTop: -8,
    marginBottom: theme.spacing.md,
  },
  calories: {
    ...typography.display_md,
    color: colors.accent_green,
  },
  caption: {
    ...typography.caption,
    color: colors.text_secondary,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  box: {
    flex: 1,
    backgroundColor: colors.bg_elevated,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    overflow: 'hidden',
  },
  value: {
    ...typography.body_xl,
  },
  label: {
    ...typography.caption,
    color: colors.text_secondary,
    marginTop: 2,
  },
  pct: {
    ...typography.body_sm,
    color: colors.accent_green,
    marginTop: theme.spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: colors.bg_primary,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    backgroundColor: colors.accent_green,
  },
});
