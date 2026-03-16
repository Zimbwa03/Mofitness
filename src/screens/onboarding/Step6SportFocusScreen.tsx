import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { MoInput } from "../../components/common/MoInput";
import type { ActivityType } from "../../models";
import type { OnboardingStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { colors, theme, typography } from "../../theme";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Step6SportFocus">;

const activityOptions: ActivityType[] = ["strength", "cardio", "flexibility", "mixed"];

export function Step6SportFocusScreen({ navigation }: Props) {
  const preferences = useAuthStore((state) => state.preferences);
  const setPreferences = useAuthStore((state) => state.setPreferences);

  const [activityType, setActivityType] = useState<ActivityType | "">(preferences.activity_type ?? "");
  const [sportFocus, setSportFocus] = useState(preferences.sport_focus);

  return (
    <OnboardingLayout
      step={6}
      title="Your sport"
      subtitle="Set the broad training mode and any specific sport you want to support."
      onBack={() => navigation.goBack()}
      onNext={() => {
        setPreferences({
          activity_type: activityType ? (activityType as ActivityType) : null,
          sport_focus: sportFocus,
        });
        navigation.navigate("Step7Nutrition");
      }}
    >
      <View style={styles.optionRow}>
        {activityOptions.map((option) => {
          const active = activityType === option;
          return (
            <Pressable key={option} onPress={() => setActivityType(option)} style={[styles.selector, active && styles.selectorActive]}>
              <Text style={[styles.selectorText, active && styles.selectorTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      <MoInput label="Sport Focus (optional)" onChangeText={setSportFocus} placeholder="e.g. football, running, netball" value={sportFocus} />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  selector: {
    width: "47%",
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  selectorActive: {
    borderColor: colors.accent_green,
  },
  selectorText: {
    ...typography.body_md,
    textTransform: "capitalize",
    color: colors.text_primary,
  },
  selectorTextActive: {
    color: colors.accent_green,
  },
});
