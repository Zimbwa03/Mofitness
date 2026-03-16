import { useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppleIcon, EyeIcon, EyeOffIcon, GoogleIcon, LockIcon, MailIcon } from "../../components/icons";
import { BrandLogo } from "../../components/common/BrandLogo";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { MoInput } from "../../components/common/MoInput";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { colors, layout, theme, typography } from "../../theme";
import { getScreenBottomPadding, getScreenTopPadding } from "../../utils/screen";
import { isEmail, isRequired } from "../../utils/validators";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const login = useAuthStore((state) => state.login);
  const loginWithProvider = useAuthStore((state) => state.loginWithProvider);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isEmail(email)) {
      setError(t("error_email_invalid"));
      return;
    }

    if (!isRequired(password)) {
      setError(t("error_password_required"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await login(email.trim(), password);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t("error_login_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: getScreenTopPadding(insets.top, theme.spacing.xl),
            paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xl),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <BrandLogo />
          <Text style={styles.heroTitle}>{t("login_heading")}</Text>
          <Text style={styles.heroSubtitle}>{t("login_subtitle")}</Text>
        </View>
        <MoCard style={styles.card}>
          <MoInput
            autoCapitalize="none"
            keyboardType="email-address"
            label={t("field_email")}
            leftIcon={<MailIcon color={colors.text_secondary} size={18} />}
            onChangeText={setEmail}
            testID="login-email"
            value={email}
          />
          <MoInput
            label={t("field_password")}
            leftIcon={<LockIcon color={colors.text_secondary} size={18} />}
            onChangeText={setPassword}
            rightSlot={
              <Pressable
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                onPress={() => setShowPassword((current) => !current)}
                style={styles.iconButton}
              >
                {showPassword ? (
                  <EyeOffIcon color={colors.text_secondary} size={18} />
                ) : (
                  <EyeIcon color={colors.text_secondary} size={18} />
                )}
              </Pressable>
            }
            secureTextEntry={!showPassword}
            style={styles.input}
            testID="login-password"
            value={password}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <MoButton loading={submitting} onPress={handleSubmit} style={styles.primaryButton}>
            {t("sign_in")}
          </MoButton>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
          <MoButton
            icon={<GoogleIcon color={colors.text_primary} size={18} />}
            onPress={() => loginWithProvider("google").catch((providerError) => setError(providerError instanceof Error ? providerError.message : "Google sign-in failed."))}
            style={styles.socialButton}
            variant="secondary"
          >
            Continue with Google
          </MoButton>
          <MoButton
            icon={<AppleIcon color={colors.text_primary} size={18} />}
            onPress={() => loginWithProvider("apple").catch((providerError) => setError(providerError instanceof Error ? providerError.message : "Apple sign-in failed."))}
            style={styles.socialButton}
            variant="secondary"
          >
            Continue with Apple
          </MoButton>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t("login_footer_prompt")}</Text>
            <Text onPress={() => navigation.navigate("SignUp")} style={styles.footerAction}>
              {t("create_account")}
            </Text>
          </View>
        </MoCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    backgroundColor: colors.bg_primary,
    justifyContent: "center",
    paddingHorizontal: layout.screen_padding_h,
  },
  hero: {
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    ...typography.display_lg,
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginTop: theme.spacing.md,
  },
  error: {
    ...typography.body_sm,
    color: colors.accent_red,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  primaryButton: {
    marginTop: theme.spacing.md,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border_subtle,
  },
  dividerText: {
    ...typography.caption,
    color: colors.text_secondary,
  },
  socialButton: {
    marginTop: theme.spacing.sm,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  footerText: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
  footerAction: {
    ...typography.body_md,
    color: colors.accent_green,
  },
});
