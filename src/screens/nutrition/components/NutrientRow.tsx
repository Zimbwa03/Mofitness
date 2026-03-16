import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type { NutrientSignal } from '../../../utils/nutrition';
import { colors, theme, typography } from '../../../theme';

interface NutrientRowProps {
  nutrient: NutrientSignal;
}

export function NutrientRow({ nutrient }: NutrientRowProps) {
  const pct = Math.max(0, Math.round((nutrient.value / Math.max(1, nutrient.target)) * 100));
  const cappedPct = Math.min(100, pct);
  const isOver = nutrient.key === 'sodium_mg' ? nutrient.value > nutrient.target : pct > 100;
  const toneColor = isOver ? colors.accent_red : cappedPct >= 80 ? colors.accent_green : cappedPct >= 50 ? colors.accent_amber : colors.text_secondary;

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text style={styles.label}>{nutrient.label}</Text>
        <Text style={[styles.value, { color: toneColor }]}>
          {nutrient.value.toFixed(nutrient.unit === 'mg' ? 0 : 1)} {nutrient.unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${cappedPct}%`, backgroundColor: toneColor }]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.meta}>{pct}% of {nutrient.target} {nutrient.unit}</Text>
        <Text style={styles.note}>{nutrient.note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: theme.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.body_md,
  },
  value: {
    ...typography.body_sm,
    fontFamily: theme.typography.bold,
  },
  track: {
    height: 8,
    backgroundColor: colors.bg_elevated,
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  meta: {
    ...typography.caption,
    color: colors.text_secondary,
  },
  note: {
    ...typography.caption,
    color: colors.text_secondary,
    flex: 1,
    textAlign: 'right',
  },
});
