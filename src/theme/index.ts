import type { Theme as NavigationTheme } from "@react-navigation/native";
import { DarkTheme as NavigationDarkTheme } from "@react-navigation/native";
import { MD3DarkTheme, type MD3Theme } from "react-native-paper";

import { animation } from "./animation";
import { colors } from "./colors";
import { fonts } from "./fonts";
import { iconColors } from "./iconColors";
import { layout, radius, spacing } from "./spacing";
import { shadows } from "./shadows";
import { typography } from "./typography";

export { animation, colors, fonts, iconColors, layout, radius, shadows, spacing, typography };

export const theme = {
  colors: {
    ...colors,
    primary: colors.accent_green,
    primaryMuted: colors.accent_amber,
    neutral: colors.text_secondary,
    surfaceSoft: colors.bg_elevated,
    surface: colors.bg_surface,
    background: colors.bg_primary,
    border: colors.border_subtle,
    text: colors.text_primary,
    textMuted: colors.text_secondary,
    success: colors.success,
    danger: colors.error,
  },
  spacing,
  radius: {
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
    pill: radius.full,
    full: radius.full,
  },
  layout,
  shadows,
  animation,
  typography: {
    ...typography,
    body: fonts.bodyRegular,
    medium: fonts.bodyMedium,
    semibold: fonts.bodyBold,
    bold: fonts.bodyBold,
    display: fonts.display,
  },
} as const;

export const paperTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.accent_green,
    onPrimary: colors.text_inverse,
    primaryContainer: colors.bg_elevated,
    onPrimaryContainer: colors.text_primary,
    secondary: colors.accent_amber,
    onSecondary: colors.text_inverse,
    secondaryContainer: colors.bg_elevated,
    onSecondaryContainer: colors.text_primary,
    background: colors.bg_primary,
    onBackground: colors.text_primary,
    surface: colors.bg_surface,
    onSurface: colors.text_primary,
    surfaceVariant: colors.bg_elevated,
    onSurfaceVariant: colors.text_secondary,
    outline: colors.border_subtle,
    error: colors.error,
  },
  roundness: radius.md,
  fonts: {
    ...MD3DarkTheme.fonts,
    bodyLarge: { ...MD3DarkTheme.fonts.bodyLarge, fontFamily: fonts.bodyRegular },
    bodyMedium: { ...MD3DarkTheme.fonts.bodyMedium, fontFamily: fonts.bodyRegular },
    bodySmall: { ...MD3DarkTheme.fonts.bodySmall, fontFamily: fonts.bodyRegular },
    labelLarge: { ...MD3DarkTheme.fonts.labelLarge, fontFamily: fonts.bodyBold },
    titleLarge: { ...MD3DarkTheme.fonts.titleLarge, fontFamily: fonts.display, letterSpacing: 0.5 },
    titleMedium: { ...MD3DarkTheme.fonts.titleMedium, fontFamily: fonts.bodyBold },
    headlineMedium: { ...MD3DarkTheme.fonts.headlineMedium, fontFamily: fonts.display, letterSpacing: 1 },
    displaySmall: { ...MD3DarkTheme.fonts.displaySmall, fontFamily: fonts.display, letterSpacing: 1 },
  },
};

export const navigationTheme: NavigationTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: colors.accent_green,
    background: colors.bg_primary,
    card: colors.bg_surface,
    text: colors.text_primary,
    border: colors.border_subtle,
    notification: colors.accent_amber,
  },
};
