import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import type { OnboardingStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { colors, theme, typography } from "../../theme";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Step5Schedule">;

const times = ["morning", "afternoon", "evening"] as const;

export function Step5ScheduleScreen({ navigation }: Props) {
  const preferences = useAuthStore((state) => state.preferences);
  const setPreferences = useAuthStore((state) => state.setPreferences);

  const [days, setDays] = useState(preferences.training_days_per_week ?? 3);
  const [preferredTime, setPreferredTime] = useState<(typeof times)[number] | "">(preferences.preferred_workout_time ?? "");
  const [error, setError] = useState("");

  const handleNext = () => {
    if (days < 1 || days > 7) {
      setError("Training days per week must be between 1 and 7.");
      return;
    }
    if (!preferredTime) {
      setError("Choose your preferred workout time.");
      return;
    }

    setPreferences({
      training_days_per_week: days,
      preferred_workout_time: preferredTime,
    });
    navigation.navigate("Step6SportFocus");
  };

  return (
    <OnboardingLayout
      step={5}
      title="Plan your week"
      subtitle="Capture your available cadence and preferred session window."
      onBack={() => navigation.goBack()}
      onNext={handleNext}
    >
      <View style={styles.dayCounter}>
        <Pressable onPress={() => setDays((value) => Math.max(1, value - 1))} style={styles.counterButton}>
          <Text style={styles.counterSymbol}>-</Text>
        </Pressable>
        <View style={styles.counterCore}>
          <Text style={styles.counterValue}>{days}</Text>
          <Text style={styles.counterLabel}>days / week</Text>
        </View>
        <Pressable onPress={() => setDays((value) => Math.min(7, value + 1))} style={styles.counterButton}>
          <Text style={styles.counterSymbol}>+</Text>
        </Pressable>
      </View>
      <View style={styles.timeRow}>
        {times.map((time) => {
          const active = preferredTime === time;
          return (
            <Pressable key={time} onPress={() => setPreferredTime(time)} style={[styles.timeCard, active && styles.timeCardActive]}>
              <Text style={[styles.timeText, active && styles.timeTextActive]}>{time}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  dayCounter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg_surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg_elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  counterSymbol: {
    ...typography.display_sm,
    color: colors.text_primary,
  },
  counterCore: {
    alignItems: "center",
  },
  counterValue: {
    ...typography.display_xl,
    color: colors.accent_green,
  },
  counterLabel: {
    ...typography.caption,
  },
  timeRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  timeCard: {
    flex: 1,
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: "center",
  },
  timeCardActive: {
    borderColor: colors.accent_green,
  },
  timeText: {
    ...typography.body_md,
    textTransform: "capitalize",
    color: colors.text_primary,
  },
  timeTextActive: {
    color: colors.accent_green,
  },
  error: {
    ...typography.body_sm,
    color: colors.accent_red,
  },
});
