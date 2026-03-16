import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { MoodDotIcon } from "../../components/icons";
import { MacroPieChart } from "../../components/charts/MacroPieChart";
import { CoachFullPanel } from "../../components/coach/CoachFullPanel";
import { MoBadge } from "../../components/common/MoBadge";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { MoProgressBar } from "../../components/common/MoProgressBar";
import { useAuth } from "../../hooks/useAuth";
import { useRecommendations } from "../../hooks/useRecommendations";
import { useWorkouts } from "../../hooks/useWorkouts";
import nutritionAIService from "../../services/ai/NutritionAIService";
import recommendationEngine from "../../services/ai/RecommendationEngine";
import trainingPlanService from "../../services/ai/TrainingPlanService";
import challengesService from "../../services/ChallengesService";
import nutritionService from "../../services/NutritionService";
import supabaseService from "../../services/SupabaseService";
import { useNutritionStore } from "../../stores/nutritionStore";
import { colors, layout, theme, typography } from "../../theme";
import { getTabScreenBottomPadding } from "../../utils/screen";
import type { DashboardStackParamList } from "../../navigation/types";
import type { RunSession } from "../../models";
import runService from "../../services/RunService";

type Props = NativeStackScreenProps<DashboardStackParamList, "DashboardHome">;

export function DashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { workouts, setWorkouts } = useWorkouts();
  const { recommendations, setRecommendations } = useRecommendations();
  const mealPlans = useNutritionStore((state) => state.mealPlans);
  const setMealPlans = useNutritionStore((state) => state.setMealPlans);
  const activeGoal = useNutritionStore((state) => state.activeGoal);
  const setActiveGoal = useNutritionStore((state) => state.setActiveGoal);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<RunSession | null>(null);
  const [todayHydrationLiters, setTodayHydrationLiters] = useState(0);
  const [latestSleepHours, setLatestSleepHours] = useState<number | null>(null);
  const [weeklyWorkoutCount, setWeeklyWorkoutCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [weeklyCalories, setWeeklyCalories] = useState(0);
  const [weeklyDistanceKm, setWeeklyDistanceKm] = useState(0);
  const [nextRewardPoints, setNextRewardPoints] = useState<number | null>(null);

  const todayISO = new Date().toISOString().slice(0, 10);
  const nextWorkout =
    workouts.find((item) => !item.completed && item.scheduled_date >= todayISO) ??
    workouts.find((item) => !item.completed) ??
    workouts[0];
  const todaysMealPlan = mealPlans[0];
  const dayLabel = new Date().toLocaleDateString(undefined, { weekday: "long" });

  const goToTab = (tab: "Workouts" | "Nutrition" | "Wellness") => {
    const parent = navigation.getParent();
    if (!parent) {
      return;
    }
    (parent as never as { navigate: (name: string) => void }).navigate(tab);
  };

  const countStreakDays = (activityDates: string[]) => {
    if (activityDates.length === 0) {
      return 0;
    }

    const unique = Array.from(new Set(activityDates.filter(Boolean))).sort((a, b) => b.localeCompare(a));
    if (unique.length === 0) {
      return 0;
    }

    let streak = 1;
    let cursor = new Date(`${unique[0]}T00:00:00`);
    for (let i = 1; i < unique.length; i += 1) {
      const prev = new Date(cursor);
      prev.setDate(prev.getDate() - 1);
      const prevISO = prev.toISOString().slice(0, 10);
      if (unique[i] !== prevISO) {
        break;
      }
      streak += 1;
      cursor = prev;
    }

    return streak;
  };

  useEffect(() => {
    if (!user || recommendations.length > 0) {
      return;
    }

    recommendationEngine
      .getWorkoutRecommendations(user.id)
      .then((items) =>
        setRecommendations(
          items.map((item) => ({
            id: item.id,
            title: item.name,
            subtitle: item.category,
            type: "workout",
          })),
        ),
      )
      .catch(() => undefined);
  }, [recommendations.length, setRecommendations, user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const client = supabaseService.getClient();

    const loadDashboardData = async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const weekStartISO = sevenDaysAgo.toISOString().slice(0, 10);

        const [
          runItems,
          runSummary,
          waterLogs,
          plannedRowsResult,
          mealLogsResult,
          wellnessResult,
          rewards,
        ] = await Promise.all([
          runService.getRecentRuns(user.id, 1),
          runService.getWeeklySummary(user.id, `${weekStartISO}T00:00:00.000Z`),
          nutritionService.getWaterLogs(user.id, todayISO),
          client
            .from("user_workouts")
            .select("id, workout_id, scheduled_date, completed_date, calories_burned, workouts(name, category, duration_minutes)")
            .eq("user_id", user.id)
            .order("scheduled_date", { ascending: true })
            .limit(40),
          client
            .from("meal_logs")
            .select("log_date, total_calories")
            .eq("user_id", user.id)
            .gte("log_date", weekStartISO),
          client
            .from("wellness_logs")
            .select("date, sleep_hours")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(14),
          challengesService.getRewards(),
        ]);

        setLastRun(runItems[0] ?? null);
        setTodayHydrationLiters(waterLogs.reduce((sum, row) => sum + row.amount_ml, 0) / 1000);
        setWeeklyCalories(Math.round(runSummary.calories));
        setWeeklyDistanceKm(runSummary.distanceMeters / 1000);

        if (wellnessResult.error) {
          throw wellnessResult.error;
        }
        const recentWellness = (wellnessResult.data ?? []) as Array<{ date: string; sleep_hours: number | null }>;
        setLatestSleepHours(recentWellness[0]?.sleep_hours ?? null);

        if (plannedRowsResult.error) {
          throw plannedRowsResult.error;
        }

        const plannedRows = (plannedRowsResult.data ?? []) as Array<{
          id: string;
          workout_id: string;
          scheduled_date: string | null;
          completed_date: string | null;
          calories_burned: number | null;
          workouts:
            | {
                name: string | null;
                category: string | null;
                duration_minutes: number | null;
              }
            | Array<{
                name: string | null;
                category: string | null;
                duration_minutes: number | null;
              }>
            | null;
        }>;

        const mappedPlan = plannedRows.map((row) => {
          const workoutMeta = Array.isArray(row.workouts) ? row.workouts[0] : row.workouts;
          return {
            id: row.id,
            title: workoutMeta?.name ?? "Planned session",
            category: workoutMeta?.category ?? "scheduled",
            scheduled_date: row.scheduled_date ?? todayISO,
            duration_minutes: workoutMeta?.duration_minutes ?? 45,
            completed: Boolean(row.completed_date),
          };
        });
        setWorkouts(mappedPlan);

        const thisWeekWorkoutCount = plannedRows.filter((row) => {
          if (!row.completed_date) {
            return false;
          }
          return row.completed_date >= weekStartISO && row.completed_date <= todayISO;
        }).length;
        setWeeklyWorkoutCount(thisWeekWorkoutCount);

        if (mealLogsResult.error) {
          throw mealLogsResult.error;
        }
        const mealLogs = (mealLogsResult.data ?? []) as Array<{ log_date: string; total_calories: number | null }>;
        const nutritionCalories = mealLogs.reduce((sum, row) => sum + Number(row.total_calories ?? 0), 0);
        setWeeklyCalories((current) => current + Math.round(nutritionCalories));

        const runDates = runItems.map((row) => row.started_at.slice(0, 10));
        const workoutDates = plannedRows.map((row) => row.completed_date).filter((value): value is string => Boolean(value));
        const nutritionDates = mealLogs.map((row) => row.log_date);
        setCurrentStreak(countStreakDays([...runDates, ...workoutDates, ...nutritionDates]));

        const points = profile?.points ?? 0;
        const sortedRewards = [...rewards].sort((a, b) => a.points_cost - b.points_cost);
        const nextReward = sortedRewards.find((item) => item.points_cost > points) ?? sortedRewards[sortedRewards.length - 1] ?? null;
        setNextRewardPoints(nextReward?.points_cost ?? null);
      } catch (error) {
        console.error("Failed to load dashboard metrics", error);
      }
    };

    void loadDashboardData();
  }, [profile?.points, setWorkouts, todayISO, user]);

  const macroSummary = useMemo(() => {
    const meals = todaysMealPlan?.meals ?? [];
    return meals.reduce(
      (acc, dish) => ({
        carbs: acc.carbs + dish.carbs_g,
        protein: acc.protein + dish.protein_g,
        fat: acc.fat + dish.fat_g,
      }),
      { carbs: 0, protein: 0, fat: 0 },
    );
  }, [todaysMealPlan]);

  const handleGenerateToday = async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    try {
      const planRows = await trainingPlanService.generateWeeklyPlan(user.id);
      setWorkouts(
        planRows.map((row, index) => ({
          id: `${row.workout_id}-${index}`,
          title: `Planned session ${index + 1}`,
          category: "scheduled",
          scheduled_date: row.scheduled_date,
          duration_minutes: 45,
          completed: false,
        })),
      );

      const today = new Date().toISOString().slice(0, 10);
      let goal = activeGoal;
      if (!goal) {
        goal = await nutritionService.getActiveGoal(user.id);
        setActiveGoal(goal ?? null);
      }
      if (goal) {
        const mealPlan = await nutritionAIService.generateDailyMealPlan(today, goal.id);
        if (mealPlan) {
          setMealPlans([mealPlan, ...mealPlans.filter((plan) => plan.id !== mealPlan.id)]);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate today's plan.";
      console.error("Failed to generate today's dashboard plan", error);
      Alert.alert("Plan Generation Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getTabScreenBottomPadding(insets.bottom) }]}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <LinearGradient colors={colors.grad_hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={styles.heroEyebrow}>Good morning,</Text>
          <Text style={styles.heroTitle}>{profile?.full_name?.split(" ")[0] ?? "Athlete"}.</Text>
          <Text style={styles.heroMeta}>{`${dayLabel} | ${nextWorkout?.category ?? "Recovery day"}`}</Text>
          <View style={styles.microStats}>
            <MoBadge>{`${weeklyCalories.toLocaleString()} KCAL`}</MoBadge>
            <MoBadge variant="blue">{`${todayHydrationLiters.toFixed(1)}L WATER`}</MoBadge>
            <MoBadge variant="amber">{`${latestSleepHours?.toFixed(1) ?? "--"}H SLEEP`}</MoBadge>
          </View>
        </LinearGradient>
      </View>
      <CoachFullPanel
        feature="Dashboard"
        message={
          latestSleepHours && latestSleepHours < 6
            ? "Sleep was below target. I have softened intensity and prioritized recovery blocks."
            : "Your latest recovery markers look good. Today's plan is aligned for quality output."
        }
        pose="chat"
      />

      <MoCard delay={100} variant="highlight">
        <Text style={styles.sectionLabel}>Today's workout</Text>
        <Text style={styles.cardTitle}>{nextWorkout?.title ?? "No workout scheduled yet"}</Text>
        <Text style={styles.supporting}>
          {nextWorkout ? `${nextWorkout.duration_minutes} min | scheduled ${nextWorkout.scheduled_date}` : "Generate your plan to schedule today's training."}
        </Text>
        <MoProgressBar style={styles.progress} value={nextWorkout ? 0.8 : 0} />
        <MoButton loading={loading} onPress={handleGenerateToday} size="medium">
          {nextWorkout ? "Refresh Plan" : "Generate Plan"}
        </MoButton>
      </MoCard>

      <MoCard delay={120} variant="glass">
        <Text style={styles.sectionLabel}>Quick Access</Text>
        <View style={styles.quickActionRow}>
          <MoButton onPress={() => goToTab("Workouts")} style={styles.quickActionBtn}>
            Workouts
          </MoButton>
          <MoButton variant="secondary" onPress={() => goToTab("Nutrition")} style={styles.quickActionBtn}>
            Nutrition
          </MoButton>
          <MoButton variant="ghost" onPress={() => goToTab("Wellness")} style={styles.quickActionBtn}>
            Wellness
          </MoButton>
        </View>
      </MoCard>

      <MoCard delay={122}>
        <Text style={styles.sectionLabel}>Run & Track</Text>
        <View style={styles.quickActionRow}>
          <MoButton onPress={() => navigation.navigate("RunDashboard")} style={styles.quickActionBtn}>
            🏃 Start A Run
          </MoButton>
          <MoButton variant="ghost" onPress={() => navigation.navigate("RunHistory")} style={styles.quickActionBtn}>
            📊 View History
          </MoButton>
        </View>
      </MoCard>

      <MoCard delay={125} variant="glass">
        <Text style={styles.sectionLabel}>Live Coach</Text>
        <Text style={styles.cardTitle}>AI Form Checker</Text>
        <Text style={styles.supporting}>Camera-based live rep coaching with form scoring, cues, and session history.</Text>
        <View style={styles.quickActionRow}>
          <MoButton onPress={() => navigation.navigate("FormCheckerSetup")} style={styles.quickActionBtn}>
            Start Form Check
          </MoButton>
          <MoButton variant="ghost" onPress={() => navigation.navigate("FormCheckerHistory")} style={styles.quickActionBtn}>
            View Scores
          </MoButton>
        </View>
      </MoCard>

      {lastRun ? (
        <MoCard delay={130} variant="glass">
          <Text style={styles.sectionLabel}>Last Run</Text>
          <Text style={styles.cardTitle}>{new Date(lastRun.started_at).toDateString()}</Text>
          <Text style={styles.supporting}>
            {((lastRun.distance_meters ?? 0) / 1000).toFixed(1)}km · {Math.round((lastRun.duration_seconds ?? 0) / 60)}min ·{" "}
            {(lastRun.avg_pace_sec_per_km ?? 0) > 0
              ? `${Math.floor((lastRun.avg_pace_sec_per_km ?? 0) / 60)}:${String(Math.round((lastRun.avg_pace_sec_per_km ?? 0) % 60)).padStart(2, "0")}/km`
              : "--"}
          </Text>
          <MoButton variant="secondary" onPress={() => navigation.navigate("RunHistory")} style={{ marginTop: theme.spacing.sm }}>
            More
          </MoButton>
        </MoCard>
      ) : null}

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          {[
            { label: "Weekly Workouts", value: String(weeklyWorkoutCount) },
            { label: "Streak", value: String(currentStreak) },
            { label: "Points", value: String(profile?.points ?? 0) },
            { label: "Distance (km)", value: weeklyDistanceKm.toFixed(1) },
          ].map((item) => (
            <MoCard key={item.label} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </MoCard>
          ))}
        </ScrollView>
      </View>

      <View>
        <Text style={styles.sectionLabel}>For you</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendationList}>
          {(recommendations.length > 0 ? recommendations.slice(0, 4) : [{ id: "empty", title: "No recommendations yet", subtitle: "Generate your plan to unlock AI picks" }]).map((item) => (
            <LinearGradient
              colors={[colors.bg_elevated, colors.bg_surface]}
              key={item.id}
              style={styles.recommendationCard}
            >
              <Text style={styles.recommendationTitle}>{item.title}</Text>
              <MoBadge variant="gray">{item.subtitle}</MoBadge>
            </LinearGradient>
          ))}
        </ScrollView>
      </View>

      <MoCard delay={280} variant="amber">
        <Text style={styles.sectionLabel}>Challenges</Text>
        <Text style={styles.cardTitle}>Next reward unlock</Text>
        <Text style={styles.rankText}>{nextRewardPoints ? `Target ${nextRewardPoints} pts` : "No reward target available"}</Text>
        <MoProgressBar style={styles.progress} value={nextRewardPoints ? Math.min(1, (profile?.points ?? 0) / nextRewardPoints) : 0} />
        <Text style={styles.supporting}>
          {nextRewardPoints ? `${profile?.points ?? 0} / ${nextRewardPoints} pts` : `${profile?.points ?? 0} pts`}
        </Text>
      </MoCard>

      <MoCard delay={340}>
        <Text style={styles.sectionLabel}>Nutrition</Text>
        <View style={styles.nutritionRow}>
          <View style={styles.nutritionChartWrap}>
            <MacroPieChart carbs={macroSummary.carbs} protein={macroSummary.protein} fat={macroSummary.fat} />
          </View>
          <View style={styles.nutritionTextWrap}>
            <Text style={styles.kcalValue}>{todaysMealPlan?.total_calories ?? 0}</Text>
            <Text style={styles.supporting}>planned kcal</Text>
            <Text style={styles.macroLine}>Protein {macroSummary.protein}g</Text>
            <Text style={styles.macroLine}>Carbs {macroSummary.carbs}g</Text>
            <Text style={styles.macroLine}>Fat {macroSummary.fat}g</Text>
          </View>
        </View>
      </MoCard>

      <MoCard delay={400} variant="glass">
        <Text style={styles.sectionLabel}>Wellness check-in</Text>
        <Text style={styles.cardTitle}>How are you feeling today?</Text>
        <View style={styles.moodRow}>
          {["Calm", "Good", "Flat", "Low", "High"].map((label) => (
            <View key={label} style={styles.moodBubble}>
              <MoodDotIcon color={colors.text_secondary} size={14} />
              <Text style={styles.moodLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingBottom: theme.spacing.xxxl, paddingTop: theme.spacing.md },
  hero: { borderRadius: theme.radius.lg, padding: theme.spacing.lg, marginBottom: theme.spacing.lg },
  heroEyebrow: { ...typography.body_md, color: colors.text_secondary },
  heroTitle: { ...typography.display_lg, marginTop: theme.spacing.xs, marginBottom: theme.spacing.xs },
  heroMeta: { ...typography.label, color: colors.accent_amber, marginBottom: theme.spacing.md },
  microStats: { flexDirection: "row", gap: theme.spacing.sm, flexWrap: "wrap" },
  sectionLabel: { ...typography.label, color: colors.accent_green, marginBottom: theme.spacing.sm },
  cardTitle: { ...typography.display_sm, marginBottom: theme.spacing.xs },
  supporting: { ...typography.body_sm, color: colors.text_secondary },
  progress: { marginVertical: theme.spacing.md },
  statsRow: { paddingBottom: theme.spacing.md, gap: theme.spacing.sm },
  statCard: { width: 130, minHeight: 118, justifyContent: "center" },
  statValue: { ...typography.display_md, color: colors.accent_green },
  statLabel: { ...typography.caption, marginTop: theme.spacing.xs },
  recommendationList: { gap: theme.spacing.sm, paddingBottom: theme.spacing.md },
  recommendationCard: { width: 170, height: 190, borderRadius: theme.radius.md, padding: theme.spacing.md, justifyContent: "flex-end", borderWidth: 1, borderColor: colors.border_subtle },
  recommendationTitle: { ...typography.body_xl, marginBottom: theme.spacing.sm },
  rankText: { ...typography.body_lg, color: colors.accent_amber },
  quickActionRow: { flexDirection: "row", gap: theme.spacing.sm },
  quickActionBtn: { flex: 1 },
  nutritionRow: { flexDirection: "row", alignItems: "center" },
  nutritionChartWrap: { flex: 1 },
  nutritionTextWrap: { flex: 1, alignItems: "flex-start" },
  kcalValue: { ...typography.display_md, color: colors.accent_green },
  macroLine: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.xs },
  moodRow: { flexDirection: "row", justifyContent: "space-between" },
  moodBubble: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.bg_elevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border_subtle,
    gap: 4,
  },
  moodLabel: {
    ...typography.caption,
    color: colors.text_secondary,
  },
});
