import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { useAuth } from "../../hooks/useAuth";
import type {
  ChallengesStackParamList,
  DashboardStackParamList,
  NutritionStackParamList,
  WellnessStackParamList,
  WorkoutsStackParamList,
} from "../../navigation/types";
import { colors, layout, theme, typography } from "../../theme";
import { getScreenBottomPadding } from "../../utils/screen";

type MenuNavigationParamList = DashboardStackParamList &
  WorkoutsStackParamList &
  ChallengesStackParamList &
  NutritionStackParamList &
  WellnessStackParamList;

export function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MenuNavigationParamList>>();
  const { profile } = useAuth();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
      showsVerticalScrollIndicator={false}
    >
      <MoCard variant="glass">
        <Text style={styles.kicker}>Quick access</Text>
        <Text style={styles.title}>More Mofitness features</Text>
        <Text style={styles.body}>
          Open the parts of the app that are not on the main tab bar, including rewards, wearables, privacy, and account tools.
        </Text>
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.supporting}>Signed in as {profile?.email ?? "your account"}.</Text>
        <View style={styles.buttonStack}>
          <MoButton onPress={() => navigation.navigate("Profile")} variant="secondary">
            Account Preferences
          </MoButton>
          <MoButton onPress={() => navigation.navigate("Settings")} variant="secondary">
            App Settings
          </MoButton>
          <MoButton onPress={() => navigation.navigate("PrivacyPolicy")} variant="secondary">
            Privacy & Security
          </MoButton>
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>More</Text>
        <View style={styles.buttonStack}>
          <MoButton onPress={() => navigation.navigate("Rewards")} variant="secondary">
            Rewards & Badges
          </MoButton>
          <MoButton onPress={() => navigation.navigate("Wearables")} variant="secondary">
            Wearables & Devices
          </MoButton>
        </View>
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  content: {
    paddingHorizontal: layout.screen_padding_h,
    paddingBottom: theme.spacing.xxxl,
  },
  kicker: {
    ...typography.label,
    color: colors.accent_green,
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...typography.display_sm,
    marginBottom: theme.spacing.sm,
  },
  body: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
  sectionTitle: {
    ...typography.display_sm,
    marginBottom: theme.spacing.xs,
  },
  supporting: {
    ...typography.body_md,
    color: colors.text_secondary,
    marginBottom: theme.spacing.md,
  },
  buttonStack: {
    gap: theme.spacing.sm,
  },
});
