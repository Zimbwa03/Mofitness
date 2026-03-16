import { Pressable, StyleSheet, Text, View } from "react-native";

import { MenuIcon, PersonIcon } from "../../components/icons";
import { useAuth } from "../../hooks/useAuth";
import { colors, radius, theme, typography } from "../../theme";

interface HeaderButtonProps {
  onPress: () => void;
}

export function MenuHeaderButton({ onPress }: HeaderButtonProps) {
  return (
    <Pressable accessibilityLabel="Open menu" accessibilityRole="button" onPress={onPress} style={styles.iconButton}>
      <MenuIcon color={colors.accent_green} size={22} />
    </Pressable>
  );
}

export function AccountHeaderButton({ onPress }: HeaderButtonProps) {
  const { profile } = useAuth();
  const initials = profile?.full_name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <Pressable accessibilityLabel="Open account preferences" accessibilityRole="button" onPress={onPress} style={styles.avatarButton}>
      <View style={styles.avatar}>
        {initials ? (
          <Text allowFontScaling style={styles.initials}>
            {initials}
          </Text>
        ) : (
          <PersonIcon color={colors.text_primary} size={18} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  avatarButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    ...typography.label,
    color: colors.accent_green,
  },
});
