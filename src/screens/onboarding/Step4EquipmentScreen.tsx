import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import type { OnboardingStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { colors, theme, typography } from "../../theme";
import { OnboardingLayout } from "./OnboardingLayout";

const equipmentOptions = ["bodyweight", "dumbbells", "resistance_bands", "bench", "barbell", "cardio_machine"];

type Props = NativeStackScreenProps<OnboardingStackParamList, "Step4Equipment">;

export function Step4EquipmentScreen({ navigation }: Props) {
  const preferences = useAuthStore((state) => state.preferences);
  const setPreferences = useAuthStore((state) => state.setPreferences);

  const [selectedEquipment, setSelectedEquipment] = useState(preferences.available_equipment);

  const toggleEquipment = (item: string) => {
    setSelectedEquipment((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  };

  return (
    <OnboardingLayout
      step={4}
      title="What do you have?"
      subtitle="Select what you reliably have access to so workouts stay realistic."
      onBack={() => navigation.goBack()}
      onNext={() => {
        setPreferences({ available_equipment: selectedEquipment });
        navigation.navigate("Step5Schedule");
      }}
    >
      <View style={styles.grid}>
        {equipmentOptions.map((item) => {
          const active = selectedEquipment.includes(item);
          return (
            <Pressable key={item} onPress={() => toggleEquipment(item)} style={[styles.cell, active && styles.cellActive]}>
              <Text style={[styles.cellText, active && styles.cellTextActive]}>{item.replaceAll("_", " ")}</Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  cell: {
    width: "30%",
    minHeight: 88,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.sm,
  },
  cellActive: {
    borderColor: colors.accent_green,
    backgroundColor: colors.bg_elevated,
  },
  cellText: {
    ...typography.body_sm,
    textAlign: "center",
    textTransform: "capitalize",
  },
  cellTextActive: {
    color: colors.accent_green,
  },
});
