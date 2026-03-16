import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { MoInput } from "../../components/common/MoInput";
import type { OnboardingStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { colors, theme, typography } from "../../theme";
import { isRequired } from "../../utils/validators";
import { OnboardingLayout } from "./OnboardingLayout";

const goalOptions = ["weight_loss", "muscle_gain", "endurance", "general_fitness", "mobility"];

type Props = NativeStackScreenProps<OnboardingStackParamList, "Step2FitnessGoals">;

export function Step2FitnessGoalsScreen({ navigation }: Props) {
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);

  const [selectedGoals, setSelectedGoals] = useState<string[]>(profile?.goals ?? []);
  const [bodyFatPct, setBodyFatPct] = useState(profile?.body_fat_pct?.toString() ?? "");
  const [error, setError] = useState("");

  const toggleGoal = (goal: string) => {
    setSelectedGoals((current) => (current.includes(goal) ? current.filter((value) => value !== goal) : [...current, goal]));
  };

  const handleNext = () => {
    if (!isRequired(selectedGoals.join(""))) {
      setError("Select at least one goal.");
      return;
    }

    setProfile({
      goals: selectedGoals,
      body_fat_pct: bodyFatPct ? Number(bodyFatPct) : null,
    });
    navigation.navigate("Step3ExperienceActivity");
  };

  return (
    <OnboardingLayout
      step={2}
      title="What are you chasing?"
      subtitle="Choose the outcomes that matter most so plans move in the right direction."
      onBack={() => navigation.goBack()}
      onNext={handleNext}
    >
      <View style={styles.tileGrid}>
        {goalOptions.map((goal) => {
          const active = selectedGoals.includes(goal);
          return (
            <Pressable key={goal} onPress={() => toggleGoal(goal)} style={[styles.tile, active && styles.tileActive]}>
              <Text style={[styles.tileText, active && styles.tileTextActive]}>{goal.replaceAll("_", " ")}</Text>
            </Pressable>
          );
        })}
      </View>
      <MoInput label="Body Fat % (optional)" keyboardType="numeric" onChangeText={setBodyFatPct} value={bodyFatPct} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  tile: {
    width: "47%",
    minHeight: 88,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    justifyContent: "center",
    padding: theme.spacing.md,
  },
  tileActive: {
    borderColor: colors.accent_green,
    backgroundColor: colors.bg_elevated,
  },
  tileText: {
    ...typography.body_md,
    textTransform: "capitalize",
  },
  tileTextActive: {
    color: colors.accent_green,
  },
  error: {
    ...typography.body_sm,
    color: colors.accent_red,
  },
});
