import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Switch, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoCard } from "../../components/common/MoCard";
import { useAuth } from "../../hooks/useAuth";
import notificationService from "../../services/NotificationService";
import { colors, layout, theme, typography } from "../../theme";
import { getScreenBottomPadding } from "../../utils/screen";

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, setProfile } = useAuth();
  const [notifications, setNotifications] = useState(profile?.notifications_enabled ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNotifications(profile?.notifications_enabled ?? true);
  }, [profile?.notifications_enabled]);

  const handleNotificationToggle = async (value: boolean) => {
    setNotifications(value);

    if (!user) {
      setProfile({ notifications_enabled: value });
      return;
    }

    setSaving(true);

    try {
      const nextProfile = await notificationService.updateNotificationPreference(user.id, value);
      setProfile(nextProfile);
    } catch {
      setNotifications(profile?.notifications_enabled ?? true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
    >
      <MoCard>
        <Text style={styles.title}>App Preferences</Text>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Workout reminders</Text>
            <Text style={styles.caption}>
              {saving ? "Saving notification settings..." : "Push prompts before training blocks."}
            </Text>
          </View>
          <Switch value={notifications} onValueChange={(value) => void handleNotificationToggle(value)} />
        </View>
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingBottom: theme.spacing.xxxl },
  title: { ...typography.display_sm, marginBottom: theme.spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { ...typography.body_xl },
  caption: { ...typography.body_sm, color: colors.text_secondary },
});
