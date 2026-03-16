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
import nutritionService from "../../services/NutritionService";
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

  const nextWorkout = workouts[0];
  const todaysMealPlan = mealPlans[0];

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
    runService
      .getRecentRuns(user.id, 1)
      .then((items) => setLastRun(items[0] ?? null))
      .catch(() => undefined);
  }, [user]);

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
          <Text style={styles.heroMeta}>Wednesday | Leg Day</Text>
          <View style={styles.microStats}>
            <MoBadge>2,340 KCAL</MoBadge>
            <MoBadge variant="blue">1.2L WATER</MoBadge>
            <MoBadge variant="amber">7H SLEEP</MoBadge>
          </View>
        </LinearGradient>
      </View>
      <CoachFullPanel
        feature="Dashboard"
        message="You slept 7.2 hours. Your body is ready and today's plan is optimized for strong output."
        pose="chat"
      />

      <MoCard delay={100} variant="highlight">
        <Text style={styles.sectionLabel}>Today's workout</Text>
        <Text style={styles.cardTitle}>{nextWorkout?.title ?? "Lower Body Power"}</Text>
        <Text style={styles.supporting}>
          {nextWorkout ? `${nextWorkout.duration_minutes} min | scheduled ${nextWorkout.scheduled_date}` : "45 min | 6 exercises"}
        </Text>
        <MoProgressBar style={styles.progress} value={nextWorkout ? 0.8 : 0} />
        <MoButton loading={loading} onPress={handleGenerateToday} size="medium">
          {nextWorkout ? "Start Workout" : "Generate Plan"}
        </MoButton>
      </MoCard>

      <MoCard delay={120}>
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
        <Text style={styles.sectionLabel}>Live Courch</Text>
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
            { label: "Weekly Workouts", value: String(workouts.length || 4) },
            { label: "Streak", value: "06" },
            { label: "Points", value: "3240" },
            { label: "Calories", value: "1840" },
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
          {(recommendations.length > 0
            ? recommendations.slice(0, 4)
            : [
                { id: "fallback-1", title: "Hill Sprint Builder", subtitle: "20 min explosive cardio" },
                { id: "fallback-2", title: "Core Stability Flow", subtitle: "Recovery and control" },
              ]
          ).map((item) => (
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
        <Text style={styles.cardTitle}>Most Calories This Week</Text>
        <Text style={styles.rankText}>Your rank #3 of 24</Text>
        <MoProgressBar style={styles.progress} value={0.52} />
        <Text style={styles.supporting}>1,840 / 3,500 kcal</Text>
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
