import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';

import type { PlannedMeal } from '../../../models';
import mealImageGenService from '../../../services/ai/MealImageGenService';
import { colors, theme, typography } from '../../../theme';
import { MoButton } from '../../../components/common/MoButton';

interface MealImageGeneratorProps {
  meal: PlannedMeal;
  planId?: string;
  countryCode: string;
  countryName: string;
  imageUrl: string | null;
  onGenerated: (imageUrl: string) => void;
}

export function MealImageGenerator({ meal, planId, countryCode, countryName, imageUrl, onGenerated }: MealImageGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const lensPulse = useSharedValue(0);

  useEffect(() => {
    if (!loading) {
      lensPulse.value = 0;
      return;
    }

    lensPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
        withTiming(0.15, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, [lensPulse, loading]);

  const primaryLensStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.8 + (0.4 * lensPulse.value) }],
    opacity: 0.25 + (0.35 * (1 - lensPulse.value)),
  }));

  const secondaryLensStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.65 + (0.25 * lensPulse.value) }],
    opacity: 0.18 + (0.22 * lensPulse.value),
  }));

  const loadingMessage = useMemo(
    () => (imageUrl ? 'Refreshing your plated meal visual...' : 'Generating your meal...'),
    [imageUrl],
  );

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await mealImageGenService.generateMealImage({
        meal,
        countryCode,
        countryName,
        planId,
      });
      if (result?.imageUrl) {
        onGenerated(result.imageUrl);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate the meal image.';
      Alert.alert('Meal Image Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.mediaWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>No meal image yet</Text>
            <Text style={styles.placeholderBody}>Generate a plated visual for this meal using the current cuisine context.</Text>
          </View>
        )}
        {loading ? (
          <View style={styles.loadingOverlay}>
            <Animated.View style={[styles.lensRing, styles.lensRingLarge, primaryLensStyle]} />
            <Animated.View style={[styles.lensRing, styles.lensRingSmall, secondaryLensStyle]} />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        ) : null}
      </View>
      <MoButton loading={loading} onPress={() => void handleGenerate()} variant={imageUrl ? 'secondary' : 'primary'}>
        {imageUrl ? 'Regenerate Meal Image' : 'Generate Meal Image'}
      </MoButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: theme.spacing.md,
  },
  mediaWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_elevated,
  },
  placeholder: {
    minHeight: 240,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_elevated,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(10,10,10,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  lensRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.accent_green,
  },
  lensRingLarge: {
    width: 150,
    height: 150,
  },
  lensRingSmall: {
    width: 88,
    height: 88,
    borderColor: colors.accent_amber,
  },
  loadingText: {
    ...typography.body_sm,
    color: colors.text_primary,
    textAlign: 'center',
    marginTop: 132,
  },
  placeholderTitle: {
    ...typography.body_xl,
  },
  placeholderBody: {
    ...typography.body_sm,
    color: colors.text_secondary,
    textAlign: 'center',
  },
});
