import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";

import { MoCard } from "../../components/common/MoCard";
import { MoInput } from "../../components/common/MoInput";
import type { OnboardingStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { colors, typography } from "../../theme";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Step8Medical">;

export function Step8MedicalScreen({ navigation }: Props) {
  const preferences = useAuthStore((state) => state.preferences);
  const setPreferences = useAuthStore((state) => state.setPreferences);

  return (
    <OnboardingLayout
      step={8}
      title="Any health conditions?"
      subtitle="List any injuries, limitations, or medical considerations that affect programming."
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("Step9Wellness")}
    >
      <MoCard variant="glass">
        <Text style={styles.disclaimer}>Share only what affects safe training decisions.</Text>
      </MoCard>
      <MoInput
        label="Medical conditions or injuries"
        multiline
        numberOfLines={4}
        onChangeText={(value) => setPreferences({ medical_conditions: value })}
        value={preferences.medical_conditions}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
});
