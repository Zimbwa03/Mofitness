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
import { useAuth } from "../../hooks/useAuth";
import runService from "../../services/RunService";
import supabaseService from "../../services/SupabaseService";
import { useChallengeStore } from "../../stores/challengeStore";
import { useCoachStore } from "../../stores/coachStore";
import { colors, layout, theme, typography } from "../../theme";
import { getTabScreenBottomPadding } from "../../utils/screen";

type Props = NativeStackScreenProps<ChallengesStackParamList, "ChallengesHome">;

export function ChallengesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const challenges = useChallengeStore((state) => state.challenges);
  const setChallenges = useChallengeStore((state) => state.setChallenges);
  const selectedCoach = useCoachStore((state) => state.selectedCoach);
  const topChallenge = challenges[0] ?? null;
  const topTarget = topChallenge?.title.includes("Distance")
    ? 20
    : topChallenge?.title.includes("Nutrition")
      ? 7
      : 5;
  const topProgress = topChallenge
    ? Math.min(1, topChallenge.progress_metric / topTarget)
    : 0;

  useEffect(() => {
    if (!user) {
      setChallenges([]);
      return;
    }

    const client = supabaseService.getClient();
    const loadChallenges = async () => {
      try {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        const weekStartISO = weekStart.toISOString().slice(0, 10);
        const todayISO = new Date().toISOString().slice(0, 10);

        const [runSummary, workoutRows, mealRows] = await Promise.all([
          runService.getWeeklySummary(user.id, `${weekStartISO}T00:00:00.000Z`),
          client
            .from("user_workouts")
            .select("completed_date")
            .eq("user_id", user.id)
            .not("completed_date", "is", null)
            .gte("completed_date", weekStartISO),
          client
            .from("meal_logs")
            .select("log_date")
            .eq("user_id", user.id)
            .gte("log_date", weekStartISO),
        ]);

        if (workoutRows.error) {
          throw workoutRows.error;
        }
        if (mealRows.error) {
          throw mealRows.error;
        }

        const workoutCount = (workoutRows.data ?? []).length;
        const mealDates = Array.from(new Set((mealRows.data ?? []).map((row) => row.log_date).filter(Boolean)));
        const nutritionDays = mealDates.length;
        const runDistanceKm = runSummary.distanceMeters / 1000;

        setChallenges([
          { id: "challenge-workout", title: "Weekly Workout Consistency", progress_metric: workoutCount, rank: null },
          { id: "challenge-run", title: "Weekly Distance (km)", progress_metric: Number(runDistanceKm.toFixed(1)), rank: null },
          { id: "challenge-nutrition", title: "Nutrition Logging Days", progress_metric: nutritionDays, rank: null },
          { id: "challenge-streak", title: "Daily Activity Streak", progress_metric: Math.max(0, Math.min(7, nutritionDays + Math.min(workoutCount, 7))), rank: null },
        ]);
      } catch (error) {
        console.error("Failed to load challenges", error);
      }
    };

    void loadChallenges();
  }, [setChallenges, user]);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getTabScreenBottomPadding(insets.bottom) }]}
      data={challenges}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <LinearGradient colors={colors.grad_amber} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.heroLabel}>Top challenge this week</Text>
            <Text style={styles.heroRank}>{topChallenge ? `${topChallenge.progress_metric}` : "--"}</Text>
            <Text style={styles.heroSub}>{topChallenge?.title ?? "No active challenge data yet"}</Text>
            <MoProgressBar style={styles.heroProgress} value={topProgress} />
            <Text style={styles.heroMetric}>{topChallenge ? `${topChallenge.progress_metric} / ${topTarget}` : "Complete activities to start tracking challenge progress"}</Text>
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
                <Text style={styles.horizontalMeta}>Live weekly progress</Text>
                <MoProgressBar
                  showLabel={false}
                  style={styles.horizontalProgress}
                  value={Math.min(
                    challenge.title.includes("Distance")
                      ? challenge.progress_metric / 20
                      : challenge.title.includes("Nutrition")
                        ? challenge.progress_metric / 7
                        : challenge.progress_metric / 5,
                    1,
                  )}
                />
                <MoBadge variant="gray">{challenge.rank ? `Rank ${challenge.rank}` : "Tracked"}</MoBadge>
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
            <MoBadge variant="amber">{item.rank ? `Rank ${item.rank}` : "Active"}</MoBadge>
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
