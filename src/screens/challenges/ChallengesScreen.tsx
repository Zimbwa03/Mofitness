import { useEffect } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CoachMessageBubble } from "../../components/coach/CoachMessageBubble";
import { MoBadge } from "../../components/common/MoBadge";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { MoProgressBar } from "../../components/common/MoProgressBar";
import type { ChallengesStackParamList } from "../../navigation/types";
import { useChallengeStore } from "../../stores/challengeStore";
import { useCoachStore } from "../../stores/coachStore";
import { colors, layout, theme, typography } from "../../theme";
import { getTabScreenBottomPadding } from "../../utils/screen";

type Props = NativeStackScreenProps<ChallengesStackParamList, "ChallengesHome">;

export function ChallengesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const challenges = useChallengeStore((state) => state.challenges);
  const setChallenges = useChallengeStore((state) => state.setChallenges);
  const selectedCoach = useCoachStore((state) => state.selectedCoach);

  useEffect(() => {
    if (challenges.length === 0) {
      setChallenges([
        { id: "challenge-1", title: "7-Day Consistency Sprint", progress_metric: 4, rank: 3 },
        { id: "challenge-2", title: "Cardio Minutes Push", progress_metric: 120, rank: 5 },
      ]);
    }
  }, [challenges.length, setChallenges]);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getTabScreenBottomPadding(insets.bottom) }]}
      data={challenges}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <LinearGradient colors={colors.grad_amber} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.heroLabel}>Most calories | week challenge</Text>
            <Text style={styles.heroRank}>#3</Text>
            <Text style={styles.heroSub}>of 24 participants</Text>
            <MoProgressBar style={styles.heroProgress} value={0.52} />
            <Text style={styles.heroMetric}>1,840 / 3,500 kcal</Text>
            <MoButton onPress={() => navigation.navigate("Leaderboard")} size="medium" variant="secondary">
              View Full Leaderboard
            </MoButton>
          </LinearGradient>
          <Text style={styles.sectionHeading}>Active challenges</Text>
          <CoachMessageBubble
            feature="Challenges"
            pose={selectedCoach === "male" ? "phone" : "chat"}
            message="Momentum wins leaderboards. Keep your daily streak alive and protect your rank."
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {challenges.map((challenge, index) => (
              <LinearGradient
                colors={index === 0 ? colors.grad_hero : colors.grad_amber}
                key={`${challenge.id}-hero`}
                style={styles.horizontalCard}
              >
                <Text style={styles.horizontalTitle}>{challenge.title}</Text>
                <Text style={styles.horizontalMeta}>Reward 100 pts</Text>
                <MoProgressBar showLabel={false} style={styles.horizontalProgress} value={0.45 + index * 0.1} />
                <MoBadge variant="gray">{challenge.rank ? `Rank ${challenge.rank}` : "Open"}</MoBadge>
              </LinearGradient>
            ))}
          </ScrollView>
          <View style={styles.filterRow}>
            <MoBadge>Active</MoBadge>
            <MoBadge variant="gray">Upcoming</MoBadge>
            <MoBadge variant="gray">Completed</MoBadge>
          </View>
        </>
      }
      renderItem={({ item }) => (
        <MoCard>
          <Text style={styles.challengeTitle}>{item.title}</Text>
          <Text style={styles.challengeMeta}>Metric progress {item.progress_metric}</Text>
          <View style={styles.challengeFooter}>
            <MoBadge variant="amber">{item.rank ? `Rank ${item.rank}` : "Join"}</MoBadge>
            <MoButton onPress={() => navigation.navigate("Leaderboard")} size="small" variant="ghost">
              View
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
  hero: { padding: theme.spacing.lg, borderRadius: theme.radius.lg, marginBottom: theme.spacing.lg, borderWidth: 1, borderColor: colors.border_subtle },
  heroLabel: { ...typography.label, color: colors.accent_amber, marginBottom: theme.spacing.sm },
  heroRank: { ...typography.display_xl, color: colors.accent_green },
  heroSub: { ...typography.body_sm, color: colors.text_secondary, marginBottom: theme.spacing.md },
  heroProgress: { marginBottom: theme.spacing.sm },
  heroMetric: { ...typography.body_md, marginBottom: theme.spacing.md },
  sectionHeading: { ...typography.display_sm, marginBottom: theme.spacing.sm },
  horizontalList: { gap: theme.spacing.sm, paddingBottom: theme.spacing.md },
  horizontalCard: { width: 210, minHeight: 150, padding: theme.spacing.md, borderRadius: theme.radius.md, borderWidth: 1, borderColor: colors.border_subtle, justifyContent: "flex-end" },
  horizontalTitle: { ...typography.body_xl, marginBottom: theme.spacing.xs },
  horizontalMeta: { ...typography.caption, marginBottom: theme.spacing.sm },
  horizontalProgress: { marginBottom: theme.spacing.sm },
  filterRow: { flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  challengeTitle: { ...typography.display_sm, marginBottom: theme.spacing.xs },
  challengeMeta: { ...typography.body_md, color: colors.text_secondary },
  challengeFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing.md },
});
