import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';

import { colors, theme, typography } from '../../../theme';

interface AccuracyScoreBadgeProps {
  score: number | null | undefined;
  confidence?: number | null;
  animated?: boolean;
}

export function AccuracyScoreBadge({ score, confidence, animated = false }: AccuracyScoreBadgeProps) {
  const safeScore = Math.round(score ?? 0);
  const backgroundColor = safeScore >= 85 ? '#B59A2B' : safeScore >= 70 ? colors.accent_green : safeScore >= 50 ? colors.accent_amber : colors.accent_red;
  const label = safeScore >= 85 ? 'Excellent' : safeScore >= 70 ? 'Great' : safeScore >= 50 ? 'Good' : 'Private';
  const [displayScore, setDisplayScore] = useState(animated ? 0 : safeScore);
  const pulse = useSharedValue(animated ? 0.96 : 1);

  useEffect(() => {
    if (!animated) {
      setDisplayScore(safeScore);
      pulse.value = 1;
      return;
    }

    setDisplayScore(0);
    pulse.value = 0.96;
    pulse.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });

    if (safeScore >= 50) {
      pulse.value = withSequence(
        withTiming(1.06, { duration: 280, easing: Easing.out(Easing.cubic) }),
        withRepeat(withSequence(withTiming(1, { duration: 820 }), withTiming(1.03, { duration: 820 })), -1, false),
      );
    }

    const startedAt = Date.now();
    const duration = 1200;
    const frame = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(1, elapsed / duration);
      setDisplayScore(Math.round(safeScore * progress));
      if (progress >= 1) {
        clearInterval(frame);
      }
    }, 16);

    return () => clearInterval(frame);
  }, [animated, pulse, safeScore]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: animated ? 0.75 + ((pulse.value - 0.96) * 6) : 1,
  }));

  const glowStyle = useMemo(
    () => ({
      shadowColor: backgroundColor,
      shadowOpacity: animated && safeScore >= 50 ? 0.35 : 0,
      shadowRadius: animated && safeScore >= 50 ? 12 : 0,
    }),
    [animated, backgroundColor, safeScore],
  );

  return (
    <Animated.View style={[styles.badge, { backgroundColor }, glowStyle, badgeStyle]}>
      <Text style={styles.text}>{displayScore}% {label}</Text>
      {typeof confidence === 'number' ? <Text style={styles.subtext}>Conf {Math.round(confidence)}%</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  text: {
    ...typography.body_sm,
    color: colors.text_inverse,
    fontFamily: theme.typography.bold,
  },
  subtext: {
    ...typography.caption,
    color: colors.text_inverse,
  },
});
