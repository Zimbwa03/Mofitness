import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

import { MoButton } from '../../../components/common/MoButton';
import { colors, theme, typography } from '../../../theme';

interface WaterTrackerProps {
  totalMl: number;
  targetLiters: number;
  onAdd250: () => void;
  onAdd500: () => void;
}

interface CupProps {
  level: number;
}

function WaterCup({ level }: CupProps) {
  const safeLevel = Math.max(0, Math.min(1, level));
  return (
    <View style={styles.cup}>
      <View style={[styles.cupFill, { height: `${safeLevel * 100}%`, opacity: 0.2 + safeLevel * 0.8 }]} />
    </View>
  );
}

export function WaterTracker({ totalMl, targetLiters, onAdd250, onAdd500 }: WaterTrackerProps) {
  const targetMl = Math.round(targetLiters * 1000);
  const ratio = Math.max(0, Math.min(1.25, totalMl / Math.max(1, targetMl)));
  const progressWidth = `${Math.min(ratio, 1) * 100}%` as `${number}%`;

  return (
    <View>
      <Text style={styles.title}>Hydration Today</Text>
      <View style={styles.cupsRow}>
        {Array.from({ length: 8 }, (_, index) => {
          const cupLevel = Math.max(0, Math.min(1, (ratio * 8) - index));
          return <WaterCup key={index} level={cupLevel} />;
        })}
      </View>
      <Text style={styles.meta}>{(totalMl / 1000).toFixed(1)}L / {targetLiters.toFixed(1)}L</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFillWrap, { width: progressWidth }]}>
          <LinearGradient colors={[colors.accent_green, colors.accent_blue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.progressGradient} />
        </View>
      </View>
      <View style={styles.actions}>
        <MoButton size="small" onPress={onAdd250} variant="secondary">+ Add 250ml</MoButton>
        <MoButton size="small" onPress={onAdd500}>+ Add 500ml</MoButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.label,
    color: colors.accent_green,
    marginBottom: theme.spacing.sm,
  },
  cupsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  cup: {
    flex: 1,
    height: 30,
    borderRadius: theme.radius.full,
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  cupFill: {
    width: '100%',
    backgroundColor: colors.accent_blue,
    borderRadius: theme.radius.full,
  },
  meta: {
    ...typography.body_md,
    color: colors.text_secondary,
    marginBottom: theme.spacing.md,
  },
  progressTrack: {
    height: 8,
    borderRadius: theme.radius.full,
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressFillWrap: {
    height: '100%',
    overflow: 'hidden',
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
});
