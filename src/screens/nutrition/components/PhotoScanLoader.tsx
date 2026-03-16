import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';

import { colors, theme, typography } from '../../../theme';

interface PhotoScanLoaderProps {
  photoUri?: string | null;
}

const steps = [
  'Identifying dishes...',
  'Estimating portions...',
  'Calculating nutrition...',
  'Comparing to your plan...',
];

export function PhotoScanLoader({ photoUri }: PhotoScanLoaderProps) {
  const scanProgress = useSharedValue(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    scanProgress.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );

    const interval = setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 650);

    return () => clearInterval(interval);
  }, [scanProgress]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -120 + (240 * scanProgress.value) }],
    opacity: 0.45 + (0.35 * (1 - Math.abs((scanProgress.value * 2) - 1))),
  }));

  const cornerStyle = useMemo(() => [styles.corner, styles.cornerTopLeft], []);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Analyzing Your Meal...</Text>
      <View style={styles.previewWrap}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.previewImage} /> : <View style={styles.previewFallback} />}
        <View style={cornerStyle} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />
        <Animated.View style={[styles.scanLine, scanLineStyle]} />
      </View>
      <View style={styles.steps}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <View style={[styles.stepDot, index <= activeStep && styles.stepDotActive]} />
            <Text style={[styles.stepText, index === activeStep && styles.stepTextActive]}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  title: {
    ...typography.body_xl,
    color: colors.accent_green,
  },
  previewWrap: {
    minHeight: 260,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    opacity: 0.72,
  },
  previewFallback: {
    flex: 1,
    backgroundColor: colors.bg_elevated,
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: colors.accent_green,
  },
  cornerTopLeft: {
    top: 14,
    left: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  cornerTopRight: {
    top: 14,
    right: 14,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  cornerBottomLeft: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  cornerBottomRight: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  scanLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.accent_green,
    shadowColor: colors.accent_green,
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  steps: {
    gap: theme.spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text_disabled,
  },
  stepDotActive: {
    backgroundColor: colors.accent_green,
  },
  stepText: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  stepTextActive: {
    color: colors.text_primary,
    fontFamily: theme.typography.bold,
  },
});
