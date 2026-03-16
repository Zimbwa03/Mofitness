import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, shadows, theme, typography } from "../../theme";

type MoButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "amber";
type MoButtonSize = "large" | "medium" | "small";

interface MoButtonProps {
  children: string;
  disabled?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  onPress?: () => void;
  size?: MoButtonSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: MoButtonVariant;
}

const HEIGHT_BY_SIZE: Record<MoButtonSize, number> = {
  large: 52,
  medium: 44,
  small: 36,
};

const variantStyles: Record<MoButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.accent_green,
    ...shadows.glow_green,
  },
  secondary: {
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_strong,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.accent_green,
  },
  danger: {
    backgroundColor: colors.accent_red,
  },
  amber: {
    backgroundColor: colors.accent_amber,
    ...shadows.glow_amber,
  },
};

const textColorByVariant: Record<MoButtonVariant, string> = {
  primary: colors.text_inverse,
  secondary: colors.text_primary,
  ghost: colors.accent_green,
  danger: "#FFFFFF",
  amber: colors.text_inverse,
};

export function MoButton({
  children,
  disabled = false,
  icon,
  loading = false,
  onPress,
  size = "large",
  style,
  testID,
  variant = "primary",
}: MoButtonProps) {
  return (
    <Pressable
      accessibilityLabel={children}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHT_BY_SIZE[size], opacity: disabled ? 0.35 : pressed ? 0.88 : 1 },
        variantStyles[variant],
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text allowFontScaling style={[styles.label, { color: textColorByVariant[variant] }]}>
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    minHeight: 44,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  label: {
    ...typography.body_lg,
    fontFamily: theme.typography.bold,
    fontSize: 15,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
