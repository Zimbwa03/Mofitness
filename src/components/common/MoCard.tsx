import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";

import { colors, layout, radius, shadows, theme } from "../../theme";

type MoCardVariant = "default" | "highlight" | "glass" | "amber";

interface MoCardProps {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  titleSlot?: ReactNode;
  variant?: MoCardVariant;
}

export function MoCard({ children, style, testID, titleSlot, variant = "default" }: MoCardProps) {
  const content = (
    <View style={[styles.content, style]} testID={testID}>
      {variant === "highlight" ? <View style={[styles.accentStrip, styles.highlightStrip]} /> : null}
      {variant === "amber" ? <View style={[styles.accentStrip, styles.amberStrip]} /> : null}
      <View style={styles.inner}>
        {titleSlot}
        {children}
      </View>
    </View>
  );

  if (variant === "glass") {
    return (
      <BlurView intensity={16} tint="dark" style={[styles.content, styles.glass, style]} testID={testID}>
        <View style={styles.inner}>
          {titleSlot}
          {children}
        </View>
      </BlurView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: radius.md,
    padding: layout.card_padding,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    ...shadows.card,
  },
  inner: {
    position: "relative",
  },
  accentStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  highlightStrip: {
    backgroundColor: colors.accent_green,
  },
  amberStrip: {
    backgroundColor: colors.accent_amber,
  },
  glass: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },
});
