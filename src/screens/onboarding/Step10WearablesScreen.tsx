import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { CoachCelebrationOverlay } from "../../components/coach/CoachCelebrationOverlay";
import { ThinkingLoader } from "../../components/coach/ThinkingLoader";
import { MoCard } from "../../components/common/MoCard";
import type { OnboardingStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { colors, theme, typography } from "../../theme";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Step10Wearables">;

export function Step10WearablesScreen({ navigation }: Props) {
  const preferences = useAuthStore((state) => state.preferences);
  const setPreferences = useAuthStore((state) => state.setPreferences);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const profile = useAuthStore((state) => state.profile);

  const [hasWearable, setHasWearable] = useState(preferences.has_wearable);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

  const handleFinish = async () => {
    setSubmitting(true);
    setError("");
    try {
      setPreferences({ has_wearable: hasWearable });
      setShowCelebration(true);
      // Let the celebration sequence render before final onboarding completion reroutes to main app.
      await new Promise((resolve) => setTimeout(resolve, 1600));
      await completeOnboarding();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to finish onboarding right now.");
      setShowCelebration(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <OnboardingLayout
        step={10}
        title="Connect your gear"
        subtitle="Let Mofitness know whether connected-device support should be prepared."
        onBack={() => navigation.goBack()}
        onNext={handleFinish}
        nextLabel="Finish"
        loading={submitting}
      >
        <View style={styles.optionRow}>
          {[
            { title: "Yes, I have a wearable", value: true },
            { title: "Not yet, maybe later", value: false },
          ].map((option) => {
            const active = hasWearable === option.value;
            return (
              <Pressable key={option.title} onPress={() => setHasWearable(option.value)} style={[styles.optionCard, active && styles.optionCardActive]}>
                <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>{option.title}</Text>
              </Pressable>
            );
          })}
        </View>
        <MoCard variant="glass">
          <Text style={styles.stubText}>Bluetooth scan stub will appear here in the next integration pass.</Text>
        </MoCard>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </OnboardingLayout>

      <CoachCelebrationOverlay
        visible={showCelebration}
        title="You're all set!"
        message={`You're all set, ${profile?.full_name?.split(" ")[0] ?? "athlete"}! Let's build something incredible.`}
        quote="Strong start. I am building your personalized training and nutrition plan now."
        actionLabel="Building your personalized plan..."
      />
      {showCelebration ? (
        <View style={styles.thinkingWrap}>
          <ThinkingLoader />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  optionRow: {
    gap: theme.spacing.sm,
  },
  optionCard: {
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  optionCardActive: {
    borderColor: colors.accent_green,
    backgroundColor: colors.bg_elevated,
  },
  optionTitle: {
    ...typography.body_xl,
    color: colors.text_primary,
  },
  optionTitleActive: {
    color: colors.accent_green,
  },
  stubText: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  error: {
    ...typography.body_sm,
    color: colors.accent_red,
  },
  thinkingWrap: {
    position: "absolute",
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.xxxl,
  },
});
