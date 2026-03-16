import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, radius, theme, typography } from "../../theme";

interface MoInputProps extends Omit<TextInputProps, "style"> {
  clearable?: boolean;
  error?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function MoInput({
  clearable = false,
  error,
  label,
  leftIcon,
  onChangeText,
  rightSlot,
  style,
  testID,
  value,
  ...props
}: MoInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label ? (
        <Text allowFontScaling style={[styles.label, focused && styles.labelFocused]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.container,
          { borderColor: error ? colors.accent_red : focused ? colors.accent_green : colors.border_subtle },
        ]}
        testID={testID}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          {...props}
          accessibilityLabel={label ?? props.placeholder}
          allowFontScaling
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholderTextColor={colors.text_disabled}
          style={styles.input}
          value={value}
        />
        {clearable && value ? (
          <Pressable accessibilityLabel={`Clear ${label ?? "input"}`} onPress={() => onChangeText?.("")} style={styles.clearButton}>
            <Text allowFontScaling style={styles.clearText}>
              x
            </Text>
          </Pressable>
        ) : null}
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      {error ? (
        <Text allowFontScaling style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    marginBottom: theme.spacing.sm,
  },
  labelFocused: {
    transform: [{ translateY: -2 }],
  },
  container: {
    minHeight: 52,
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  leftIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    minHeight: 50,
    color: colors.text_primary,
    fontFamily: theme.typography.body,
    fontSize: 15,
  },
  clearButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    color: colors.text_secondary,
    fontSize: 18,
    lineHeight: 20,
    textTransform: "uppercase",
  },
  rightSlot: {
    marginLeft: theme.spacing.sm,
  },
  error: {
    ...typography.body_sm,
    color: colors.accent_red,
    marginTop: theme.spacing.xs,
  },
});
