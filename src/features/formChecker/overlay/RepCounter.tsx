import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { colors, theme, typography } from "../../../theme";
import type { ExercisePhase } from "../types";

interface RepCounterOverlayProps {
  repCount: number;
  phase: ExercisePhase;
  formScore: number;
}

export function RepCounterOverlay({ repCount, phase, formScore }: RepCounterOverlayProps) {
  const accent = formScore >= 85 ? colors.accent_green : formScore >= 65 ? colors.accent_amber : colors.error;

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Text style={[styles.count, { color: accent }]}>{repCount}</Text>
      <Text style={styles.phase}>{phase.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: theme.spacing.lg,
    top: "35%",
    alignItems: "center",
  },
  count: {
    ...typography.display_xl,
    fontSize: 94,
    lineHeight: 94,
    opacity: 0.72,
  },
  phase: {
    ...typography.label,
    color: colors.text_secondary,
    marginTop: -6,
  },
});
