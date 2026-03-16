import { colors } from "./colors";
import { fonts } from "./fonts";

export const typography = {
  display_xl: { fontFamily: fonts.display, fontSize: 72, letterSpacing: 2, color: colors.text_primary },
  display_lg: { fontFamily: fonts.display, fontSize: 48, letterSpacing: 1.5, color: colors.text_primary },
  display_md: { fontFamily: fonts.display, fontSize: 36, letterSpacing: 1, color: colors.text_primary },
  display_sm: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 0.5, color: colors.text_primary },
  body_xl: { fontFamily: fonts.bodyBold, fontSize: 18, lineHeight: 26, color: colors.text_primary },
  body_lg: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24, color: colors.text_primary },
  body_md: { fontFamily: fonts.bodyRegular, fontSize: 14, lineHeight: 22, color: colors.text_primary },
  body_sm: { fontFamily: fonts.bodyRegular, fontSize: 12, lineHeight: 18, color: colors.text_primary },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    color: colors.text_secondary,
  },
  caption: { fontFamily: fonts.bodyRegular, fontSize: 10, lineHeight: 14, color: colors.text_secondary },
} as const;
