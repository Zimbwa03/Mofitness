import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { MoButton } from "../common/MoButton";
import { colors, theme, typography } from "../../theme";

interface SetLoggerProps {
  onSave: (payload: { reps: number; weight: number }) => void;
}

function NumberControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
}) {
  return (
    <View style={styles.control}>
      <View style={styles.controlRow}>
        <Pressable onPress={() => onChange(Math.max(0, value - 1))} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>-</Text>
        </Pressable>
        <Text style={styles.controlValue}>{value}</Text>
        <Pressable onPress={() => onChange(value + 1)} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>+</Text>
        </Pressable>
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </View>
  );
}

export function SetLogger({ onSave }: SetLoggerProps) {
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(20);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log your set</Text>
      <View style={styles.setBubbleRow}>
        {[1, 2, 3, 4].map((setNumber) => (
          <View key={setNumber} style={[styles.setBubble, setNumber === 1 && styles.setBubbleActive]}>
            <Text style={[styles.setBubbleText, setNumber === 1 && styles.setBubbleTextActive]}>{setNumber}</Text>
          </View>
        ))}
      </View>
      <View style={styles.controlsRow}>
        <NumberControl label="REPS" onChange={setReps} value={reps} />
        <NumberControl label="KG WEIGHT" onChange={setWeight} value={weight} />
      </View>
      <MoButton onPress={() => onSave({ reps, weight })}>Log Set</MoButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  title: {
    ...typography.label,
    color: colors.accent_amber,
  },
  setBubbleRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  setBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  setBubbleActive: {
    backgroundColor: colors.accent_green,
    borderColor: colors.accent_green,
  },
  setBubbleText: {
    ...typography.body_md,
    color: colors.text_primary,
  },
  setBubbleTextActive: {
    color: colors.text_inverse,
  },
  controlsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  control: {
    flex: 1,
    backgroundColor: colors.bg_elevated,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg_surface,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonText: {
    ...typography.display_sm,
    color: colors.text_primary,
  },
  controlValue: {
    ...typography.display_md,
    color: colors.accent_green,
  },
  controlLabel: {
    ...typography.label,
    marginTop: theme.spacing.sm,
    color: colors.text_secondary,
    textAlign: "center",
  },
});
