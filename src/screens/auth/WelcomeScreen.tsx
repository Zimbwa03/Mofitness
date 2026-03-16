import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getCoachImage } from "../../assets/coaches";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { BrandLogo } from "../../components/common/BrandLogo";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import type { AuthStackParamList } from "../../navigation/types";
import { colors, layout, theme, typography } from "../../theme";
import { getScreenBottomPadding, getScreenTopPadding } from "../../utils/screen";

type Props = NativeStackScreenProps<AuthStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: getScreenTopPadding(insets.top, theme.spacing.lg),
          paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.lg),
        },
      ]}
    >
      <View style={styles.headerBlock}>
        <View style={styles.switcherRow}>
          <LanguageSwitcher />
        </View>
        <BrandLogo />
        <Text style={styles.title}>{t("welcome_headline")}</Text>
        <Text style={styles.subtitle}>{t("welcome_subtitle_power")}</Text>
        <View style={styles.coachHero}>
          <View style={styles.heroGlow} />
          <Image
            source={getCoachImage("male", "standing")}
            style={styles.coachMale}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Mo standing coach image"
          />
          <Image
            source={getCoachImage("female", "standing")}
            style={styles.coachFemale}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Nia standing coach image"
          />
        </View>
      </View>

      <MoCard style={styles.card} variant="glass">
        <Text style={styles.cardTitle}>{t("welcome_card_title")}</Text>
        <Text style={styles.cardBody}>{t("welcome_card_body")}</Text>
        <MoButton onPress={() => navigation.navigate("Login")} style={styles.primaryButton}>
          {t("sign_in")}
        </MoButton>
        <MoButton onPress={() => navigation.navigate("SignUp")} variant="secondary">
          {t("create_account")}
        </MoButton>
      </MoCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
    paddingHorizontal: layout.screen_padding_h,
    justifyContent: "space-between",
  },
  headerBlock: {
    marginTop: theme.spacing.xl,
  },
  switcherRow: {
    alignItems: "flex-end",
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...typography.display_lg,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...typography.body_lg,
    color: colors.text_secondary,
    maxWidth: 320,
  },
  coachHero: {
    marginTop: theme.spacing.lg,
    height: 250,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    overflow: "hidden",
    position: "relative",
  },
  heroGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: 20,
    left: "50%",
    marginLeft: -90,
    backgroundColor: "rgba(200,241,53,0.1)",
  },
  coachMale: {
    position: "absolute",
    left: -8,
    bottom: 0,
    width: "52%",
    height: 248,
  },
  coachFemale: {
    position: "absolute",
    right: -8,
    bottom: 0,
    width: "52%",
    height: 248,
  },
  card: {
    marginBottom: 0,
  },
  cardTitle: {
    ...typography.display_sm,
    marginBottom: theme.spacing.sm,
  },
  cardBody: {
    ...typography.body_md,
    color: colors.text_secondary,
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    marginBottom: theme.spacing.sm,
  },
});
