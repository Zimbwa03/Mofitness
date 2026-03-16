import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, theme, typography } from "../../theme";

type MoBadgeVariant = "green" | "amber" | "red" | "blue" | "gray";

interface MoBadgeProps {
  children: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: MoBadgeVariant;
}

const variantMap: Record<MoBadgeVariant, { backgroundColor: string; color: string }> = {
  green: { backgroundColor: "rgba(200,241,53,0.16)", color: colors.accent_green },
  amber: { backgroundColor: "rgba(245,166,35,0.16)", color: colors.accent_amber },
  red: { backgroundColor: "rgba(255,59,48,0.16)", color: colors.accent_red },
  blue: { backgroundColor: "rgba(10,132,255,0.16)", color: colors.accent_blue },
  gray: { backgroundColor: colors.bg_elevated, color: colors.text_secondary },
};

export function MoBadge({ children, style, testID, variant = "green" }: MoBadgeProps) {
  return (
    <View style={[styles.base, variantMap[variant], style]} testID={testID}>
      <Text allowFontScaling style={[styles.label, { color: variantMap[variant].color }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  label: {
    ...typography.label,
    color: colors.text_primary,
  },
});
