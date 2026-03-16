import type { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackIcon } from "../icons";
import { colors, layout, theme, typography } from "../../theme";

export function MoHeader({ back, navigation, options, route }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const title = typeof options.title === "string" ? options.title : route.name;
  const headerLeft = options.headerLeft?.({
    canGoBack: Boolean(back),
    tintColor: colors.text_primary,
    label: back?.title ?? title,
    href: undefined,
  });
  const headerRight = options.headerRight?.({
    canGoBack: Boolean(back),
    tintColor: colors.text_primary,
  });

  return (
    <View style={[styles.container, { height: layout.header_height + insets.top, paddingTop: insets.top }]}>
      <View style={styles.side}>
        {headerLeft ?? (back ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={navigation.goBack}
            style={styles.iconButton}
          >
            <BackIcon color={colors.text_primary} size={24} />
          </Pressable>
        ) : (
          <Text allowFontScaling style={styles.logo}>
            MO
          </Text>
        ))}
      </View>
      <Text allowFontScaling numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={[styles.side, styles.rightSide]}>{headerRight}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg_primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.screen_padding_h,
  },
  side: {
    width: 48,
    justifyContent: "center",
  },
  rightSide: {
    alignItems: "flex-end",
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    ...typography.display_sm,
    color: colors.accent_green,
  },
  title: {
    ...typography.display_sm,
    flex: 1,
    textAlign: "center",
    color: colors.text_primary,
  },
});
