import { FlatList, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { MoBadge } from "../../components/common/MoBadge";
import { useAuth } from "../../hooks/useAuth";
import { useChallengeStore } from "../../stores/challengeStore";
import { colors, layout, theme, typography } from "../../theme";
import { getScreenBottomPadding } from "../../utils/screen";

export function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const rewards = useChallengeStore((state) => state.rewards);
  const badges = useChallengeStore((state) => state.badges);
  const userBadges = useChallengeStore((state) => state.userBadges);

  const earnedBadgeIds = new Set(userBadges.map((badge) => badge.badge_id));

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
      data={rewards}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <MoCard variant="amber">
            <Text style={styles.pointsValue}>{profile?.points ?? 0}</Text>
            <Text style={styles.pointsLabel}>Available points</Text>
          </MoCard>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeRow}>
            {badges.map((badge) => (
              <MoCard
                key={badge.id}
                variant={earnedBadgeIds.has(badge.id) ? "highlight" : "default"}
                style={styles.badgeCard}
              >
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDescription}>{badge.description ?? "Achievement badge"}</Text>
                <MoBadge variant={earnedBadgeIds.has(badge.id) ? "green" : "gray"}>
                  {earnedBadgeIds.has(badge.id) ? "earned" : "locked"}
                </MoBadge>
              </MoCard>
            ))}
          </View>
          <Text style={styles.sectionTitle}>Redeem rewards</Text>
        </>
      }
      renderItem={({ item }) => (
        <MoCard>
          <Text style={styles.rewardTitle}>{item.title}</Text>
          <Text style={styles.rewardDescription}>{item.description ?? "Reward item"}</Text>
          <View style={styles.rewardFooter}>
            <MoBadge variant="amber">{`${item.points_cost} PTS`}</MoBadge>
            <MoButton size="small" variant="secondary">
              Redeem
            </MoButton>
          </View>
        </MoCard>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingBottom: theme.spacing.xxxl },
  pointsValue: { ...typography.display_xl, color: colors.text_inverse, textAlign: "center" },
  pointsLabel: { ...typography.body_md, color: colors.text_inverse, textAlign: "center" },
  sectionTitle: { ...typography.display_sm, marginBottom: theme.spacing.sm },
  badgeRow: { gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  badgeCard: { minHeight: 120 },
  badgeTitle: { ...typography.body_xl, marginBottom: theme.spacing.xs },
  badgeDescription: { ...typography.body_sm, color: colors.text_secondary, marginBottom: theme.spacing.sm },
  rewardTitle: { ...typography.body_xl, marginBottom: theme.spacing.xs },
  rewardDescription: { ...typography.body_md, color: colors.text_secondary, marginBottom: theme.spacing.md },
  rewardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
