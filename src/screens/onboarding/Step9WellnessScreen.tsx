import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import { Switch, Text } from "react-native-paper";

import type { OnboardingStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { colors, theme, typography } from "../../theme";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Step9Wellness">;

export function Step9WellnessScreen({ navigation }: Props) {
  const preferences = useAuthStore((state) => state.preferences);
  const setPreferences = useAuthStore((state) => state.setPreferences);

  const [mindfulness, setMindfulness] = useState(preferences.interest_in_mindfulness);
  const [challenges, setChallenges] = useState(preferences.wants_challenges);

  return (
    <OnboardingLayout
      step={9}
      title="Mind and body"
      subtitle="Decide whether recovery and motivation features should be emphasized."
      onBack={() => navigation.goBack()}
      onNext={() => {
        setPreferences({
          interest_in_mindfulness: mindfulness,
          wants_challenges: challenges,
        });
        navigation.navigate("Step10Wearables");
      }}
    >
      <View style={styles.row}>
        <Text style={styles.label}>Mindfulness and recovery support</Text>
        <Switch value={mindfulness} onValueChange={setMindfulness} />
      </View>
      <Text style={styles.label}>Challenge and leaderboard features</Text>
      <View style={styles.toggleRow}>
        {[
          { label: "Yes", value: true },
          { label: "No", value: false },
        ].map((option) => {
          const active = challenges === option.value;
          return (
            <Pressable key={option.label} onPress={() => setChallenges(option.value)} style={[styles.toggleCard, active && styles.toggleCardActive]}>
              <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.bg_surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  label: {
    ...typography.body_md,
    color: colors.text_primary,
  },
  toggleRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  toggleCard: {
    flex: 1,
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: "center",
  },
  toggleCardActive: {
    borderColor: colors.accent_green,
  },
  toggleText: {
    ...typography.body_md,
    color: colors.text_primary,
  },
  toggleTextActive: {
    color: colors.accent_green,
  },
});
