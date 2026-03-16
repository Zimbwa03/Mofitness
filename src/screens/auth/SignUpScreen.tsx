import { useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppleIcon, EyeIcon, EyeOffIcon, GoogleIcon, LockIcon, MailIcon, PersonIcon, ShieldCheckIcon } from "../../components/icons";
import { BrandLogo } from "../../components/common/BrandLogo";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { MoInput } from "../../components/common/MoInput";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { colors, layout, radius, theme, typography } from "../../theme";
import { getScreenBottomPadding, getScreenTopPadding } from "../../utils/screen";
import { isEmail, isRequired, isStrongEnoughPassword } from "../../utils/validators";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;

function getPasswordStrength(password: string) {
  if (password.length === 0) return 0;
  if (password.length < 8) return 1;
  if (password.length < 10) return 2;
  if (/[A-Z]/.test(password) && /\d/.test(password)) return 4;
  return 3;
}

export function SignUpScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const register = useAuthStore((state) => state.register);
  const loginWithProvider = useAuthStore((state) => state.loginWithProvider);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = () => {
    if (!isRequired(fullName)) {
      return t("error_full_name_required");
    }
    if (!isEmail(email)) {
      return t("error_email_invalid");
    }
    if (!isStrongEnoughPassword(password)) {
      return t("error_password_length");
    }
    if (password !== confirmPassword) {
      return t("error_password_mismatch");
    }
    return "";
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await register(fullName.trim(), email.trim(), password);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t("error_signup_failed"));
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
          <Text style={styles.heroTitle}>{t("signup_heading")}</Text>
          <Text style={styles.heroSubtitle}>{t("signup_subtitle")}</Text>
        </View>
        <MoCard style={styles.card}>
          <MoInput
            label={t("field_full_name")}
            leftIcon={<PersonIcon color={colors.text_secondary} size={18} />}
            onChangeText={setFullName}
            testID="signup-full-name"
            value={fullName}
          />
          <MoInput
            autoCapitalize="none"
            keyboardType="email-address"
            label={t("field_email")}
            leftIcon={<MailIcon color={colors.text_secondary} size={18} />}
            onChangeText={setEmail}
            style={styles.input}
            testID="signup-email"
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
            testID="signup-password"
            value={password}
          />
          <View style={styles.strengthRow}>
            {[0, 1, 2, 3].map((segment) => (
              <View
                key={segment}
                style={[
                  styles.strengthSegment,
                  segment < strength
                    ? segment < 1
                      ? styles.strengthWeak
                      : segment < 3
                        ? styles.strengthMid
                        : styles.strengthStrong
                    : undefined,
                ]}
              />
            ))}
          </View>
          <MoInput
            label={t("field_confirm_password")}
            leftIcon={<ShieldCheckIcon color={colors.text_secondary} size={18} />}
            onChangeText={setConfirmPassword}
            rightSlot={
              <Pressable
                accessibilityLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                onPress={() => setShowConfirmPassword((current) => !current)}
                style={styles.iconButton}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon color={colors.text_secondary} size={18} />
                ) : (
                  <EyeIcon color={colors.text_secondary} size={18} />
                )}
              </Pressable>
            }
            secureTextEntry={!showConfirmPassword}
            style={styles.input}
            testID="signup-confirm-password"
            value={confirmPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.caption}>{t("signup_terms")}</Text>
          <MoButton loading={submitting} onPress={handleSubmit} style={styles.primaryButton}>
            {t("create_account")}
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
            <Text style={styles.footerText}>{t("signup_footer_prompt")}</Text>
            <Text onPress={() => navigation.navigate("Login")} style={styles.footerAction}>
              {t("sign_in")}
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
  strengthRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  strengthSegment: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bg_elevated,
  },
  strengthWeak: {
    backgroundColor: colors.accent_red,
  },
  strengthMid: {
    backgroundColor: colors.accent_amber,
  },
  strengthStrong: {
    backgroundColor: colors.accent_green,
  },
  error: {
    ...typography.body_sm,
    color: colors.accent_red,
    marginTop: theme.spacing.sm,
  },
  caption: {
    ...typography.caption,
    marginTop: theme.spacing.md,
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
