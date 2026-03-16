import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { MoInput } from "../../components/common/MoInput";
import type { ActivityLevel, ExperienceLevel } from "../../models";
import type { OnboardingStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { colors, theme, typography } from "../../theme";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Step3ExperienceActivity">;

const experienceOptions: ExperienceLevel[] = ["beginner", "intermediate", "advanced"];
const activityOptions: ActivityLevel[] = ["sedentary", "lightly_active", "active", "highly_active"];

export function Step3ExperienceActivityScreen({ navigation }: Props) {
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile?.experience_level ?? "beginner");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(profile?.activity_level ?? null);
  const [heightCm, setHeightCm] = useState(profile?.height_cm?.toString() ?? "");
  const [weightKg, setWeightKg] = useState(profile?.weight_kg?.toString() ?? "");
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!activityLevel) {
      setError("Select your current activity level.");
      return;
    }

    setProfile({
      experience_level: experienceLevel,
      activity_level: activityLevel,
      height_cm: heightCm ? Number(heightCm) : null,
      weight_kg: weightKg ? Number(weightKg) : null,
    });
    navigation.navigate("Step4Equipment");
  };

  return (
    <OnboardingLayout
      step={3}
      title="Experience and activity"
      subtitle="This helps Mofitness calibrate intensity and recovery expectations."
      onBack={() => navigation.goBack()}
      onNext={handleNext}
    >
      <View style={styles.optionRow}>
        {experienceOptions.map((option) => {
          const active = experienceLevel === option;
          return (
            <Pressable key={option} onPress={() => setExperienceLevel(option)} style={[styles.selector, active && styles.selectorActive]}>
              <Text style={[styles.selectorTitle, active && styles.selectorTitleActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.stackedOptions}>
        {activityOptions.map((option) => {
          const active = activityLevel === option;
          return (
            <Pressable key={option} onPress={() => setActivityLevel(option)} style={[styles.rowOption, active && styles.rowOptionActive]}>
              <Text style={[styles.rowOptionText, active && styles.rowOptionTextActive]}>{option.replaceAll("_", " ")}</Text>
            </Pressable>
          );
        })}
      </View>
      <MoInput label="Height (cm)" keyboardType="numeric" onChangeText={setHeightCm} value={heightCm} />
      <MoInput label="Weight (kg)" keyboardType="numeric" onChangeText={setWeightKg} value={weightKg} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  selector: {
    flex: 1,
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  selectorActive: {
    borderColor: colors.accent_green,
    backgroundColor: colors.bg_elevated,
  },
  selectorTitle: {
    ...typography.body_md,
    textTransform: "capitalize",
    color: colors.text_primary,
  },
  selectorTitleActive: {
    color: colors.accent_green,
  },
  stackedOptions: {
    gap: theme.spacing.sm,
  },
  rowOption: {
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  rowOptionActive: {
    borderColor: colors.accent_green,
  },
  rowOptionText: {
    ...typography.body_md,
    textTransform: "capitalize",
    color: colors.text_primary,
  },
  rowOptionTextActive: {
    color: colors.accent_green,
  },
  error: {
    ...typography.body_sm,
    color: colors.accent_red,
  },
});
