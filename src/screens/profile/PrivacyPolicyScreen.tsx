import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { useAuth } from "../../hooks/useAuth";
import supabaseService from "../../services/SupabaseService";
import { colors, layout, theme, typography } from "../../theme";
import { getScreenBottomPadding } from "../../utils/screen";

export function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleResetPassword = async () => {
    if (!profile?.email) {
      setMessage("No account email is available for password reset.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const { error } = await supabaseService.requestPasswordReset(profile.email);
      if (error) {
        throw error;
      }
      setMessage(`Password reset email sent to ${profile.email}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start password reset.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
    >
      <MoCard>
        <Text style={styles.title}>Privacy & Security</Text>
        <Text style={styles.body}>
          Mofitness stores training, nutrition, and wellness data in Supabase and uses Vertex AI for plan generation.
          Production account deletion should be handled through a protected server function.
        </Text>
        <MoButton loading={submitting} onPress={handleResetPassword} variant="secondary">
          Send Password Reset Email
        </MoButton>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <MoButton variant="danger">Delete My Account</MoButton>
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingBottom: theme.spacing.xxxl },
  title: { ...typography.display_sm, marginBottom: theme.spacing.sm },
  body: { ...typography.body_md, color: colors.text_secondary, marginBottom: theme.spacing.md },
  message: { ...typography.body_sm, color: colors.accent_amber, marginVertical: theme.spacing.md },
});
