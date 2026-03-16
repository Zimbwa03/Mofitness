import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { colors, radius, theme, typography } from "../../theme";

interface MoProgressBarProps {
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  value: number;
}

export function MoProgressBar({ showLabel = true, style, testID, value }: MoProgressBarProps) {
  const percentage = Math.round(Math.max(0, Math.min(1, value)) * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      style={[styles.row, style]}
      testID={testID}
    >
      <View style={styles.track}>
        <View style={[styles.fillWrap, { width: `${percentage}%` }]}>
          <LinearGradient
            colors={[colors.accent_green, colors.accent_amber]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fill}
          />
        </View>
      </View>
      {showLabel ? (
        <Text allowFontScaling style={styles.label}>
          {percentage}%
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bg_elevated,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  fillWrap: {
    height: "100%",
  },
  fill: {
    width: "100%",
    height: "100%",
    borderRadius: radius.full,
  },
  label: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
});
