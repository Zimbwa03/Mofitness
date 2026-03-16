import { useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoBadge } from "../../components/common/MoBadge";
import { MoButton } from "../../components/common/MoButton";
import { CoachMessageBubble } from "../../components/coach/CoachMessageBubble";
import { useWorkouts } from "../../hooks/useWorkouts";
import type { WorkoutsStackParamList } from "../../navigation/types";
import exerciseLibraryService from "../../services/ExerciseLibraryService";
import workoutService from "../../services/WorkoutService";
import { colors, layout, theme, typography } from "../../theme";
import { getFooterBottomPadding } from "../../utils/screen";
import { WorkoutAvatar } from "./components/WorkoutAvatar";

type Props = NativeStackScreenProps<WorkoutsStackParamList, "WorkoutDetail">;

type WorkoutDetailTab = "overview" | "exercises" | "history";

const TAB_LABELS: Array<{ key: WorkoutDetailTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "exercises", label: "Exercises" },
  { key: "history", label: "History" },
];

function formatTag(value: string) {
  return value.replace(/_/g, " ");
}

export function WorkoutDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { allWorkouts } = useWorkouts();
  const [activeTab, setActiveTab] = useState<WorkoutDetailTab>("overview");
  const [previewAnimationKey, setPreviewAnimationKey] = useState<string | null>(null);

  const workout = useMemo(() => {
    return allWorkouts.find((item) => item.id === route.params.workoutId) ?? workoutService.getWorkoutById(route.params.workoutId);
  }, [allWorkouts, route.params.workoutId]);

  const footerPaddingBottom = getFooterBottomPadding(insets.bottom);
  const footerHeight = 52 + theme.spacing.md + footerPaddingBottom;

  if (!workout) {
    return (
      <View style={styles.missingState}>
        <Text style={styles.missingTitle}>Workout not found</Text>
        <MoButton onPress={() => navigation.goBack()} size="medium">
          Back
        </MoButton>
      </View>
    );
  }

  const previewKey = previewAnimationKey ?? workout.exercises[0]?.animationKey ?? "rest";

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: footerHeight + theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={["rgba(200,241,53,0.22)", "rgba(20,20,20,0.95)"]} style={styles.hero}>
          <View style={styles.heroAvatarWrap}>
            <WorkoutAvatar exercise={previewKey} isActive size={240} />
          </View>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>{workout.name.toUpperCase()}</Text>
            <Text style={styles.heroMeta}>
              {workout.category} · {workout.durationMinutes} min · {workout.difficulty} · ~{workout.caloriesEstimate} kcal
            </Text>
            <View style={styles.badgeRow}>
              <MoBadge>{workout.category}</MoBadge>
              <MoBadge variant="gray">{workout.difficulty}</MoBadge>
              <MoBadge variant="amber">{workout.format.replace("_", " ")}</MoBadge>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.tabsRow}>
          {TAB_LABELS.map((tab) => {
            const active = tab.key === activeTab;

            return (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tabButton, active && styles.tabButtonActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "overview" ? (
          <View style={styles.sectionWrap}>
            <CoachMessageBubble
              feature="Workout"
              pose="chat"
              message="Pro tip: own the eccentric phase and keep your breathing rhythm controlled from first rep to last."
            />
            <Text style={styles.description}>{workout.description}</Text>

            <View style={styles.quoteCard}>
              <Text style={styles.quoteLabel}>Momentum</Text>
              <Text style={styles.quoteText}>"{workout.motivationQuote}"</Text>
              <Text style={styles.quoteMeta}>{workout.intensitySummary}</Text>
            </View>

            <View style={styles.overviewBlock}>
              <Text style={styles.sectionTitle}>Anatomy Focus</Text>
              <Text style={styles.sectionMeta}>{workout.anatomySummary}</Text>
              <Text style={styles.sectionMeta}>Primary: {workout.muscleGroups.slice(0, 3).map(formatTag).join(", ")}</Text>
              <Text style={styles.sectionMeta}>Secondary: {workout.muscleGroups.slice(3).map(formatTag).join(", ") || "core stability"}</Text>
            </View>

            <View style={styles.overviewBlock}>
              <Text style={styles.sectionTitle}>Equipment Needed</Text>
              <View style={styles.equipmentWrap}>
                {workout.equipment.length === 0 ? (
                  <MoBadge variant="gray">No equipment</MoBadge>
                ) : (
                  workout.equipment.map((equipment) => (
                    <MoBadge key={equipment} variant="gray">
                      {equipment.replace(/_/g, " ")}
                    </MoBadge>
                  ))
                )}
              </View>
            </View>

            <View style={styles.overviewBlock}>
              <Text style={styles.sectionTitle}>Benefits</Text>
              {workout.benefits.map((benefit) => (
                <Text key={benefit} style={styles.tipText}>
                  • {benefit}
                </Text>
              ))}
            </View>

            <View style={styles.overviewBlock}>
              <Text style={styles.sectionTitle}>Coach Notes</Text>
              {workout.coachNotes.map((tip) => (
                <Text key={tip} style={styles.tipText}>
                  • {tip}
                </Text>
              ))}
            </View>

            <View style={styles.overviewBlock}>
              <Text style={styles.sectionTitle}>Medical And Recovery Notes</Text>
              {workout.medicalConsiderations.map((note) => (
                <Text key={note} style={styles.tipText}>
                  • {note}
                </Text>
              ))}
              {workout.recoveryNotes.map((note) => (
                <Text key={note} style={styles.tipTextMuted}>
                  • {note}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {activeTab === "exercises" ? (
          <View style={styles.sectionWrap}>
            {workout.exercises.map((exercise, index) => {
              const exerciseMeta = exerciseLibraryService.getExerciseById(exercise.exerciseId);

              return (
                <View key={`${exercise.exerciseId}-${exercise.order}`} style={styles.exerciseCard}>
                  <View style={styles.exerciseRow}>
                    <Text style={styles.exerciseIndex}>{String(index + 1).padStart(2, "0")}</Text>
                    <View style={styles.exerciseContent}>
                      <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.sets} sets × {exercise.reps} · {exercise.restSeconds}s rest
                      </Text>
                      {exercise.suggestedLoad ? <Text style={styles.exerciseMeta}>Suggested: {exercise.suggestedLoad}</Text> : null}
                      {exerciseMeta ? (
                        <Text style={styles.exerciseMeta}>
                          Primary: {exerciseMeta.musclePrimary.map(formatTag).join(", ")} · Secondary:{" "}
                          {exerciseMeta.muscleSecondary.map(formatTag).join(", ") || "stability"}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {exerciseMeta ? (
                    <View style={styles.exerciseDetails}>
                      <Text style={styles.detailText}>{exerciseMeta.anatomyFocus}</Text>
                      <Text style={styles.detailTextStrong}>{exerciseMeta.setImpact}</Text>
                      {exercise.stimulusNote ? <Text style={styles.detailText}>{exercise.stimulusNote}</Text> : null}
                      <Text style={styles.detailText}>Cue: {exercise.cue ?? exerciseMeta.coachingCues[0] ?? "Move under control."}</Text>
                      {exerciseMeta.benefits.slice(0, 2).map((benefit) => (
                        <Text key={benefit} style={styles.detailBullet}>
                          • {benefit}
                        </Text>
                      ))}
                      {exerciseMeta.medicalConsiderations[0] ? (
                        <Text style={styles.detailWarning}>Medical note: {exerciseMeta.medicalConsiderations[0]}</Text>
                      ) : null}
                      {exerciseMeta.progressions[0] ? <Text style={styles.detailText}>Progression: {exerciseMeta.progressions[0]}</Text> : null}
                      {exerciseMeta.regressions[0] ? <Text style={styles.detailText}>Regression: {exerciseMeta.regressions[0]}</Text> : null}
                      <Text style={styles.detailQuote}>"{exerciseMeta.motivationQuote}"</Text>
                    </View>
                  ) : null}

                  <Pressable onPress={() => setPreviewAnimationKey(exercise.animationKey)} style={styles.previewButton}>
                    <Text style={styles.previewButtonText}>Preview animation</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}

        {activeTab === "history" ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            <View style={styles.historyCard}>
              <Text style={styles.historyDate}>Mar 14 · Completed</Text>
              <Text style={styles.historyMeta}>45:22 · 24 sets · 420 kcal</Text>
            </View>
            <View style={styles.historyCard}>
              <Text style={styles.historyDate}>Mar 11 · Completed</Text>
              <Text style={styles.historyMeta}>43:10 · 22 sets · 402 kcal</Text>
            </View>
            <View style={styles.historyCard}>
              <Text style={styles.historyDate}>Mar 08 · Completed</Text>
              <Text style={styles.historyMeta}>46:33 · 24 sets · 428 kcal</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
        <MoButton
          onPress={() =>
            navigation.navigate("WorkoutPlayer", {
              workoutId: workout.id,
              title: workout.name,
            })
          }
        >
          Start Workout
        </MoButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg_primary },
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h },
  hero: {
    minHeight: 280,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  heroAvatarWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: theme.spacing.md,
  },
  heroOverlay: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  heroTitle: {
    ...typography.display_lg,
    fontSize: 42,
    lineHeight: 44,
  },
  heroMeta: {
    ...typography.body_sm,
    color: colors.text_secondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: colors.bg_surface,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    padding: 4,
    gap: 4,
    marginBottom: theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.accent_green,
  },
  tabText: {
    ...typography.label,
    color: colors.text_secondary,
  },
  tabTextActive: {
    color: colors.text_inverse,
  },
  sectionWrap: {
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  description: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
  overviewBlock: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  sectionTitle: {
    ...typography.display_sm,
  },
  sectionMeta: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
  equipmentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  tipText: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
  tipTextMuted: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  quoteCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.accent_green,
    backgroundColor: "rgba(200,241,53,0.08)",
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  quoteLabel: {
    ...typography.label,
    color: colors.accent_green,
  },
  quoteText: {
    ...typography.body_xl,
    color: colors.text_primary,
  },
  quoteMeta: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  exerciseCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  exerciseRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  exerciseIndex: {
    ...typography.display_sm,
    color: colors.accent_green,
    width: 34,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseDetails: {
    gap: theme.spacing.xs,
  },
  exerciseName: {
    ...typography.body_xl,
    marginBottom: 4,
  },
  exerciseMeta: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  detailText: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  detailTextStrong: {
    ...typography.body_sm,
    color: colors.text_primary,
  },
  detailBullet: {
    ...typography.body_sm,
    color: colors.text_primary,
  },
  detailWarning: {
    ...typography.body_sm,
    color: colors.accent_amber,
  },
  detailQuote: {
    ...typography.body_sm,
    color: colors.accent_green,
  },
  previewButton: {
    borderWidth: 1,
    borderColor: colors.accent_green,
    alignSelf: "flex-start",
    borderRadius: theme.radius.full,
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.md,
  },
  previewButtonText: {
    ...typography.label,
    color: colors.accent_green,
  },
  historyCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    padding: theme.spacing.md,
  },
  historyDate: {
    ...typography.body_lg,
    color: colors.text_primary,
  },
  historyMeta: {
    ...typography.body_sm,
    color: colors.text_secondary,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.screen_padding_h,
    paddingTop: theme.spacing.md,
    backgroundColor: colors.bg_primary,
  },
  missingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg_primary,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  missingTitle: {
    ...typography.display_sm,
  },
});
