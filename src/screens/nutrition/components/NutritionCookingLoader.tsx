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

const cookingMessages = [
  'Mo is building your plan...',
  'Sourcing the best local ingredients...',
  'Calculating your exact macros...',
  'Timing your meals for peak performance...',
  'Almost ready - your nutrition plan is coming...',
];

export function NutritionCookingLoader() {
  const [messageIndex, setMessageIndex] = useState(0);
  const armRotation = useSharedValue(-18);
  const bodyBob = useSharedValue(0);
  const steamLift = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % cookingMessages.length);
    }, 1500);

    armRotation.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(-18, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    bodyBob.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 850, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 850, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    steamLift.value = withRepeat(
      withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );

    return () => clearInterval(interval);
  }, [armRotation, bodyBob, steamLift]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bodyBob.value }],
  }));

  const armStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${armRotation.value}deg` }],
  }));

  const steamPrimaryStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + (1 - steamLift.value) * 0.45,
    transform: [{ translateY: -22 * steamLift.value }, { translateX: -6 * steamLift.value }],
  }));

  const steamSecondaryStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + (1 - steamLift.value) * 0.35,
    transform: [{ translateY: -28 * steamLift.value }, { translateX: 5 * steamLift.value }],
  }));

  const message = useMemo(() => cookingMessages[messageIndex], [messageIndex]);

  return (
    <View style={styles.card}>
      <View style={styles.scene}>
        <Animated.View style={[styles.avatarWrap, bodyStyle]}>
          <View style={styles.head} />
          <View style={styles.torso} />
          <View style={styles.leftArm} />
          <Animated.View style={[styles.rightArmWrap, armStyle]}>
            <View style={styles.rightArm} />
            <View style={styles.ladle} />
          </Animated.View>
        </Animated.View>

        <View style={styles.potWrap}>
          <Animated.View style={[styles.steam, styles.steamPrimary, steamPrimaryStyle]} />
          <Animated.View style={[styles.steam, styles.steamSecondary, steamSecondaryStyle]} />
          <View style={styles.potLid} />
          <View style={styles.potBody} />
          <View style={styles.potHandleLeft} />
          <View style={styles.potHandleRight} />
        </View>
      </View>

      <Text style={styles.title}>Chef Mo</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  scene: {
    width: '100%',
    minHeight: 210,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarWrap: {
    position: 'absolute',
    left: '18%',
    bottom: 58,
    width: 92,
    height: 130,
    alignItems: 'center',
  },
  head: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent_green,
    marginBottom: 6,
  },
  torso: {
    width: 16,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.accent_green,
  },
  leftArm: {
    position: 'absolute',
    top: 38,
    left: 11,
    width: 50,
    height: 8,
    borderRadius: 6,
    backgroundColor: colors.accent_green,
    transform: [{ rotate: '10deg' }],
  },
  rightArmWrap: {
    position: 'absolute',
    top: 38,
    left: 30,
    width: 62,
    alignItems: 'flex-start',
  },
  rightArm: {
    width: 54,
    height: 8,
    borderRadius: 6,
    backgroundColor: colors.accent_green,
  },
  ladle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent_amber,
    marginTop: -2,
    marginLeft: 46,
  },
  potWrap: {
    width: 170,
    height: 120,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  steam: {
    position: 'absolute',
    width: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.32)',
    top: 6,
  },
  steamPrimary: {
    left: 58,
  },
  steamSecondary: {
    left: 92,
  },
  potLid: {
    width: 86,
    height: 12,
    borderRadius: 10,
    backgroundColor: colors.accent_amber,
    marginBottom: 4,
  },
  potBody: {
    width: 118,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.accent_amber,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  potHandleLeft: {
    position: 'absolute',
    bottom: 26,
    left: 16,
    width: 18,
    height: 20,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.accent_amber,
  },
  potHandleRight: {
    position: 'absolute',
    bottom: 26,
    right: 16,
    width: 18,
    height: 20,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.accent_amber,
  },
  title: {
    ...typography.body_xl,
    color: colors.accent_green,
  },
  message: {
    ...typography.body_sm,
    color: colors.text_secondary,
    textAlign: 'center',
  },
});
