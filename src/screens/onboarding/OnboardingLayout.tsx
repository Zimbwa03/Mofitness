import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCoachImage } from "../../assets/coaches";
import { MoButton } from "../../components/common/MoButton";
import { MoProgressBar } from "../../components/common/MoProgressBar";
import { useCoachStore } from "../../stores/coachStore";
import { colors, layout, theme, typography } from "../../theme";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  loading?: boolean;
  nextLabel?: string;
  onBack?: () => void;
  onNext: () => void;
  step: number;
  subtitle: string;
  title: string;
}

export function OnboardingLayout({
  children,
  loading = false,
  nextLabel = "Continue",
  onBack,
  onNext,
  step,
  subtitle,
  title,
}: OnboardingLayoutProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const coachImage = useCoachImage("chat");
  const coachName = useCoachStore((state) => state.coachName);
  const coachMessages: Record<number, string> = {
    1: "This helps me calculate your exact calorie needs.",
    2: "Choose as many as you want. I will prioritize them for you.",
    3: "Be honest, I will meet you exactly where you are.",
    4: "I will only plan workouts you can actually do.",
    5: "Consistency beats intensity. What days work for you?",
    6: "Tell me your sport and I will train you specifically for it.",
    7: "I will match meals to your culture and cuisine.",
    8: "Your safety is everything. This stays private.",
    9: "Your mind matters as much as your body.",
    10: "Connect your device for even richer coaching.",
  };
  const resolvedLabel = nextLabel === "Continue" ? t("continue") : nextLabel === "Finish" ? t("finish") : nextLabel;
  const footerPaddingBottom = Math.max(insets.bottom, theme.spacing.md);
  const coachBarHeight = 66;
  const footerHeight = coachBarHeight + 52 + theme.spacing.md * 2 + footerPaddingBottom;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: footerHeight + theme.spacing.lg }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Text style={styles.stepCounter}>{String(step).padStart(2, "0")} / 10</Text>
          {onBack ? (
            <Text onPress={onBack} style={styles.backLink}>
              Back
            </Text>
          ) : (
            <View />
          )}
        </View>
        <MoProgressBar showLabel={false} style={styles.progress} value={step / 10} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.body}>{children}</View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
        {coachMessages[step] ? (
          <View style={styles.coachPresenceBar}>
            <Image
              source={coachImage}
              style={styles.coachAvatar}
              accessibilityRole="image"
              accessibilityLabel={`${coachName} onboarding coach chat pose`}
            />
            <Text style={styles.coachPresenceText}>{coachMessages[step]}</Text>
          </View>
        ) : null}
        <MoButton loading={loading} onPress={onNext}>
          {resolvedLabel}
        </MoButton>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  content: {
    paddingHorizontal: layout.screen_padding_h,
    paddingTop: theme.spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  stepCounter: {
    ...typography.display_sm,
    color: colors.accent_green,
  },
  backLink: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
  progress: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...typography.display_md,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...typography.body_md,
    color: colors.text_secondary,
    marginBottom: theme.spacing.lg,
  },
  body: {
    gap: theme.spacing.md,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.screen_padding_h,
    paddingTop: theme.spacing.md,
    backgroundColor: colors.bg_primary,
    gap: theme.spacing.md,
  },
  coachPresenceBar: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.accent_green,
  },
  coachPresenceText: {
    flex: 1,
    ...typography.body_sm,
    color: colors.text_primary,
  },
});
