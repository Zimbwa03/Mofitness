import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { colors, theme, typography } from "../../../theme";
import type { ActiveFormError } from "../types";

interface FormErrorBadgeProps {
  error: ActiveFormError;
  x: number;
  y: number;
}

const severityColor = {
  critical: colors.error,
  warning: colors.accent_amber,
  info: colors.accent_green,
};

export function FormErrorBadge({ error, x, y }: FormErrorBadgeProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.badge,
        {
          left: x - 48,
          top: y - 46,
          borderColor: severityColor[error.severity],
          backgroundColor: error.severity === "critical" ? "rgba(255,59,48,0.16)" : "rgba(14,14,14,0.86)",
        },
      ]}
    >
      <Text style={styles.label}>{error.cue.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  label: {
    ...typography.caption,
    color: "#FFFFFF",
    fontFamily: theme.typography.bold,
    letterSpacing: 0.4,
  },
});
