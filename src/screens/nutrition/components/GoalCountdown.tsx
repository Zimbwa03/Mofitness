import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { MoProgressBar } from '../../../components/common/MoProgressBar';
import { colors, theme, typography } from '../../../theme';

interface GoalCountdownProps {
  currentWeightKg: number;
  targetWeightKg: number | null;
  targetDate: string;
  latestWeightKg?: number | null;
  goalLabel: string;
  dayNumber?: number | null;
}

export function GoalCountdown({ currentWeightKg, targetWeightKg, targetDate, latestWeightKg, goalLabel, dayNumber }: GoalCountdownProps) {
  const today = new Date();
  const target = new Date(targetDate);
  const daysLeft = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
  const start = currentWeightKg;
  const targetWeight = targetWeightKg ?? currentWeightKg;
  const current = latestWeightKg ?? currentWeightKg;
  const denominator = Math.max(Math.abs(targetWeight - start), 0.1);
  const progress = Math.min(Math.abs(current - start) / denominator, 1);
  const resolvedDayNumber = Math.max(1, dayNumber ?? 1);

  return (
    <View>
      <Text style={styles.eyebrow}>{goalLabel}</Text>
      <Text style={styles.title}>Day {resolvedDayNumber} · {daysLeft} days left</Text>
      <Text style={styles.meta}>{`${current.toFixed(1)} kg -> ${targetWeight.toFixed(1)} kg`}</Text>
      <MoProgressBar style={styles.progress} value={progress} />
      <Text style={styles.caption}>Keep meal timing consistent. The app will adjust the day around what you log.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...typography.label,
    color: colors.accent_amber,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...typography.display_sm,
  },
  meta: {
    ...typography.body_md,
    color: colors.text_secondary,
    marginTop: theme.spacing.xs,
  },
  progress: {
    marginVertical: theme.spacing.md,
  },
  caption: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
});


