import { useEffect, useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoButton } from "../../components/common/MoButton";
import { CoachMessageBubble } from "../../components/coach/CoachMessageBubble";
import { useAuth } from "../../hooks/useAuth";
import { useWorkouts } from "../../hooks/useWorkouts";
import type { WorkoutsStackParamList } from "../../navigation/types";
import workoutAIService from "../../services/ai/WorkoutAIService";
import trainingPlanService from "../../services/ai/TrainingPlanService";
import workoutService from "../../services/WorkoutService";
import { colors, layout, theme, typography } from "../../theme";
import { getTabScreenBottomPadding } from "../../utils/screen";
import { AIWorkoutSearch } from "./components/AIWorkoutSearch";
import { FilterBar, type FilterChip } from "./components/FilterBar";
import { WorkoutCard } from "./components/WorkoutCard";

import type { WorkoutSortBy } from "../../models/workout";

type Props = NativeStackScreenProps<WorkoutsStackParamList, "WorkoutsHome">;

const SORT_OPTIONS: WorkoutSortBy[] = [
  "recommended",
  "newest",
  "duration_asc",
  "duration_desc",
  "calories_desc",
  "rating_desc",
  "most_done",
];

function formatSortLabel(sortBy: WorkoutSortBy) {
  switch (sortBy) {
    case "recommended":
      return "Recommended";
    case "newest":
      return "Newest";
    case "duration_asc":
      return "Duration (Short)";
    case "duration_desc":
      return "Duration (Long)";
    case "calories_desc":
      return "Calories";
    case "rating_desc":
      return "Rating";
    case "most_done":
      return "Most Done";
    default:
      return "Recommended";
  }
}

function getWeekOfYear(date: Date) {
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function WorkoutsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, profile, preferences } = useAuth();
  const {
    workouts,
    setWorkouts,
    allWorkouts,
    filteredWorkouts,
    activeFilters,
    searchQuery,
    aiRecommendations,
    isAILoading,
    weeklyPlan,
    initializeCatalog,
    patchFilters,
    setSearchQuery,
    setAIRecommendations,
    setAILoading,
  } = useWorkouts();

  const [aiModalVisible, setAiModalVisible] = useState(false);

  useEffect(() => {
    if (allWorkouts.length === 0) {
      initializeCatalog();
    }
  }, [allWorkouts.length, initializeCatalog]);

  useEffect(() => {
    if (!user || workouts.length > 0) {
      return;
    }

    trainingPlanService
      .generateWeeklyPlan(user.id)
      .then((rows) =>
        setWorkouts(
          rows.map((row, index) => ({
            id: row.workout_id,
            title: `Workout ${index + 1}`,
            category: "planned",
            scheduled_date: row.scheduled_date,
            duration_minutes: 45,
            completed: false,
          })),
        ),
      )
      .catch(() => undefined);
  }, [setWorkouts, user, workouts.length]);

  const todayWorkout = useMemo(() => workoutService.getTodaysWorkoutFromPlan(workouts), [workouts]);

  const activeChipData = useMemo(() => {
    const isAllActive =
      activeFilters.category.length === 0 &&
      activeFilters.difficulty.length === 0 &&
      !activeFilters.bodyweight_only &&
      activeFilters.duration_range[0] === 5 &&
      activeFilters.duration_range[1] === 90;

    const chips: FilterChip[] = [
      {
        id: "all",
        label: "All",
        active: isAllActive,
        onPress: () =>
          patchFilters({
            category: [],
            difficulty: [],
            bodyweight_only: false,
            duration_range: [5, 90],
            equipment: [],
            format: [],
          }),
      },
      {
        id: "strength",
        label: "Strength",
        active: activeFilters.category.includes("strength"),
        onPress: () =>
          patchFilters({
            category: activeFilters.category.includes("strength")
              ? activeFilters.category.filter((item) => item !== "strength")
              : [...activeFilters.category, "strength"],
          }),
      },
      {
        id: "cardio",
        label: "Cardio",
        active: activeFilters.category.includes("cardio"),
        onPress: () =>
          patchFilters({
            category: activeFilters.category.includes("cardio")
              ? activeFilters.category.filter((item) => item !== "cardio")
              : [...activeFilters.category, "cardio"],
          }),
      },
      {
        id: "hiit",
        label: "HIIT",
        active: activeFilters.category.includes("hiit"),
        onPress: () =>
          patchFilters({
            category: activeFilters.category.includes("hiit")
              ? activeFilters.category.filter((item) => item !== "hiit")
              : [...activeFilters.category, "hiit"],
          }),
      },
      {
        id: "core",
        label: "Core",
        active: activeFilters.category.includes("core"),
        onPress: () =>
          patchFilters({
            category: activeFilters.category.includes("core")
              ? activeFilters.category.filter((item) => item !== "core")
              : [...activeFilters.category, "core"],
          }),
      },
      {
        id: "beginner",
        label: "Beginner",
        active: activeFilters.difficulty.includes("beginner"),
        onPress: () =>
          patchFilters({
            difficulty: activeFilters.difficulty.includes("beginner")
              ? activeFilters.difficulty.filter((item) => item !== "beginner")
              : [...activeFilters.difficulty, "beginner"],
          }),
      },
      {
        id: "intermediate",
        label: "Intermediate",
        active: activeFilters.difficulty.includes("intermediate"),
        onPress: () =>
          patchFilters({
            difficulty: activeFilters.difficulty.includes("intermediate")
              ? activeFilters.difficulty.filter((item) => item !== "intermediate")
              : [...activeFilters.difficulty, "intermediate"],
          }),
      },
      {
        id: "quick",
        label: "Quick <15",
        active: activeFilters.duration_range[0] === 5 && activeFilters.duration_range[1] === 15,
        onPress: () =>
          patchFilters({
            duration_range:
              activeFilters.duration_range[0] === 5 && activeFilters.duration_range[1] === 15 ? [5, 90] : [5, 15],
          }),
      },
      {
        id: "no_equipment",
        label: "No Equipment",
        active: activeFilters.bodyweight_only,
        onPress: () => patchFilters({ bodyweight_only: !activeFilters.bodyweight_only }),
      },
    ];

    return chips;
  }, [activeFilters, patchFilters]);

  const weekNumber = getWeekOfYear(new Date());
  const completedCount = workouts.filter((workout) => workout.completed).length;
  const catalogSummary = useMemo(() => workoutService.getCatalogSummary(), []);

  const handleSortCycle = () => {
    const currentIdx = SORT_OPTIONS.indexOf(activeFilters.sort_by);
    const nextSort = SORT_OPTIONS[(currentIdx + 1) % SORT_OPTIONS.length];
    patchFilters({ sort_by: nextSort });
  };

  const handleAIQuery = async (query: string) => {
    if (!profile) {
      return;
    }

    setAILoading(true);
    setSearchQuery(query);

    try {
      const recommendations = await workoutAIService.searchByGoal(query, profile, preferences, allWorkouts);
      const matched = recommendations
        .map((recommendation) => allWorkouts.find((workout) => workout.id === recommendation.workoutId) ?? null)
        .filter((workout): workout is NonNullable<typeof workout> => Boolean(workout));

      setAIRecommendations(matched);
      setAiModalVisible(false);
    } finally {
      setAILoading(false);
    }
  };

  return (
    <>
      <FlatList
        style={styles.container}
        data={filteredWorkouts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.content, { paddingBottom: getTabScreenBottomPadding(insets.bottom) }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.headerBlock}>
              <Text style={styles.title}>WORKOUTS</Text>
              <Text style={styles.subtitle}>Week {weekNumber} · {completedCount} of 5 sessions done</Text>
              <Text style={styles.subtitleStrong}>
                {catalogSummary.workoutCount} guided workouts built from {catalogSummary.exerciseCount.toLocaleString()} exercises.
              </Text>
            </View>
            <CoachMessageBubble
              feature="Workout Pick"
              pose="chat"
              message="Tell me your goal, available time, and equipment. I will prioritize the best workout for today."
            />

            <View style={styles.insightRow}>
              <View style={styles.insightCard}>
                <Text style={styles.insightValue}>{catalogSummary.exerciseCount.toLocaleString()}</Text>
                <Text style={styles.insightLabel}>Exercises</Text>
              </View>
              <View style={styles.insightCard}>
                <Text style={styles.insightValue}>{catalogSummary.workoutCount}</Text>
                <Text style={styles.insightLabel}>Workout Paths</Text>
              </View>
              <View style={styles.insightCard}>
                <Text style={styles.insightValue}>{catalogSummary.featuredWorkoutCount}</Text>
                <Text style={styles.insightLabel}>Featured</Text>
              </View>
            </View>

            <Pressable onPress={() => setAiModalVisible(true)} style={styles.aiSearchCard}>
              <Text style={styles.aiSearchIcon}>*</Text>
              <View style={styles.aiSearchTextWrap}>
                <Text style={styles.aiSearchTitle}>{searchQuery ? searchQuery : "What do you want to achieve?"}</Text>
                <Text style={styles.aiSearchHint}>
                  {isAILoading ? "Mo is building your plan..." : "Tap to describe your goal, time, equipment, and pain points"}
                </Text>
              </View>
              <Text style={styles.aiSearchMic}>MIC</Text>
            </Pressable>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>THIS WEEK</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
              {weeklyPlan.map((slot) => (
                <View key={slot.dateISO} style={[styles.dayChip, slot.isToday && styles.dayChipActive]}>
                  <Text style={[styles.dayLabel, slot.isToday && styles.dayLabelActive]}>{slot.dayLabel}</Text>
                  <View style={[styles.dayDot, slot.workoutCategory === "rest" && styles.dayDotRest]} />
                </View>
              ))}
            </ScrollView>

            {todayWorkout ? (
              <View style={styles.todayCardWrap}>
                <WorkoutCard
                  workout={todayWorkout}
                  onPress={() => navigation.navigate("WorkoutDetail", { workoutId: todayWorkout.id, title: todayWorkout.name })}
                  onStart={() => navigation.navigate("WorkoutPlayer", { workoutId: todayWorkout.id, title: todayWorkout.name })}
                />
                <MoButton
                  size="small"
                  onPress={() => navigation.navigate("WorkoutPlayer", { workoutId: todayWorkout.id, title: todayWorkout.name })}
                >
                  Start Now
                </MoButton>
              </View>
            ) : null}

            <FilterBar chips={activeChipData} onOpenAdvanced={() => undefined} />

            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Sort</Text>
              <Pressable onPress={handleSortCycle} style={styles.sortControl}>
                <Text style={styles.sortControlText}>{formatSortLabel(activeFilters.sort_by)}</Text>
              </Pressable>
            </View>

            {aiRecommendations.length > 0 ? (
              <View style={styles.aiResultsSection}>
                <Text style={styles.sectionLabel}>* RECOMMENDED FOR YOU</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aiRecommendationsRow}>
                  {aiRecommendations.map((workout, index) => (
                    <WorkoutCard
                      compact
                      key={workout.id}
                      delay={index * 80}
                      workout={workout}
                      onPress={() => navigation.navigate("WorkoutDetail", { workoutId: workout.id, title: workout.name })}
                      onStart={() => navigation.navigate("WorkoutPlayer", { workoutId: workout.id, title: workout.name })}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>ALL WORKOUTS</Text>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <View style={styles.gridItem}>
            <WorkoutCard
              workout={item}
              delay={index * 80}
              onPress={() => navigation.navigate("WorkoutDetail", { workoutId: item.id, title: item.name })}
              onStart={() => navigation.navigate("WorkoutPlayer", { workoutId: item.id, title: item.name })}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <CoachMessageBubble
              feature="Workout"
              pose="squat"
              message="I do not have a workout for this filter yet. Reset filters or ask me to generate one."
            />
            <Text style={styles.emptyTitle}>No workouts match this filter yet.</Text>
            <Text style={styles.emptyBody}>Try resetting filters or use AI search to generate options.</Text>
          </View>
        }
      />

      <AIWorkoutSearch
        visible={aiModalVisible}
        isLoading={isAILoading}
        onClose={() => setAiModalVisible(false)}
        onSubmit={handleAIQuery}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  content: {
    paddingHorizontal: layout.screen_padding_h,
  },
  headerBlock: {
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...typography.display_lg,
  },
  subtitle: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  subtitleStrong: {
    ...typography.body_md,
    color: colors.text_primary,
    marginTop: theme.spacing.xs,
  },
  insightRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  insightCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_surface,
    padding: theme.spacing.sm,
  },
  insightValue: {
    ...typography.display_sm,
    color: colors.accent_green,
  },
  insightLabel: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  aiSearchCard: {
    borderWidth: 1,
    borderColor: colors.accent_green,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_surface,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  aiSearchIcon: {
    ...typography.display_sm,
    color: colors.accent_green,
  },
  aiSearchTextWrap: {
    flex: 1,
  },
  aiSearchTitle: {
    ...typography.body_lg,
    color: colors.text_primary,
  },
  aiSearchHint: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  aiSearchMic: {
    ...typography.label,
    color: colors.accent_amber,
  },
  sectionHeader: {
    marginBottom: theme.spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.accent_green,
  },
  weekStrip: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  dayChip: {
    width: 42,
    height: 58,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: colors.border_strong,
    backgroundColor: colors.bg_surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dayChipActive: {
    borderColor: colors.accent_green,
    backgroundColor: "rgba(200,241,53,0.22)",
  },
  dayLabel: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  dayLabelActive: {
    color: colors.accent_green,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent_green,
  },
  dayDotRest: {
    backgroundColor: colors.text_secondary,
  },
  todayCardWrap: {
    marginBottom: theme.spacing.sm,
  },
  sortRow: {
    marginVertical: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sortLabel: {
    ...typography.label,
    color: colors.text_secondary,
  },
  sortControl: {
    borderWidth: 1,
    borderColor: colors.border_strong,
    borderRadius: theme.radius.full,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: colors.bg_surface,
  },
  sortControlText: {
    ...typography.body_sm,
    color: colors.text_primary,
  },
  aiResultsSection: {
    marginBottom: theme.spacing.sm,
  },
  aiRecommendationsRow: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  gridRow: {
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  gridItem: {
    flex: 1,
    maxWidth: "49%",
  },
  emptyWrap: {
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border_strong,
    backgroundColor: colors.bg_surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    ...typography.display_sm,
    marginBottom: theme.spacing.xs,
  },
  emptyBody: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
});
