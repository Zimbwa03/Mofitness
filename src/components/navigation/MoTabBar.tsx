import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabIcon } from "../icons";
import { colors, layout, radius, shadows, theme, typography } from "../../theme";

const iconByRoute: Record<string, "home" | "workouts" | "challenges" | "nutrition" | "wellness"> = {
  Dashboard: "home",
  Workouts: "workouts",
  Challenges: "challenges",
  Nutrition: "nutrition",
  Wellness: "wellness",
};

export function MoTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.container, { height: 64 + bottomPadding, paddingBottom: bottomPadding }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const iconName = iconByRoute[route.name] ?? "home";
        const isCenter = route.name === "Challenges";

        return (
          <Pressable
            accessibilityLabel={options.tabBarAccessibilityLabel}
            accessibilityRole="button"
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={({ pressed }) => [styles.tab, isCenter && styles.centerTabWrap, pressed && styles.pressedTab]}
          >
            {isFocused && !isCenter ? <View style={styles.activeIndicator} /> : null}
            <View style={[isCenter ? styles.centerTab : undefined, isFocused && !isCenter ? styles.activeIconWrap : undefined]}>
              <TabIcon
                color={isCenter ? colors.text_inverse : isFocused ? colors.accent_green : colors.text_disabled}
                name={iconName}
                size={24}
              />
            </View>
            {isFocused ? (
              <Text allowFontScaling style={styles.label}>
                {route.name === "Dashboard" ? "Home" : route.name}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    minHeight: 64,
    backgroundColor: colors.bg_surface,
    borderTopWidth: 1,
    borderTopColor: colors.border_subtle,
    paddingTop: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pressedTab: {
    opacity: 0.82,
  },
  centerTabWrap: {
    justifyContent: "center",
  },
  centerTab: {
    width: 54,
    height: 54,
    borderRadius: radius.full,
    backgroundColor: colors.accent_green,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10,
    ...shadows.glow_green,
  },
  activeIndicator: {
    width: 32,
    height: 2,
    borderRadius: radius.full,
    backgroundColor: colors.accent_green,
    marginBottom: theme.spacing.xs,
  },
  activeIconWrap: {
    ...shadows.glow_green,
  },
  label: {
    ...typography.label,
    color: colors.accent_green,
    marginTop: 4,
  },
});
