import { useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CoachFullPanel } from "../../components/coach/CoachFullPanel";
import { MoButton } from "../../components/common/MoButton";
import type { WorkoutsStackParamList } from "../../navigation/types";
import { colors, layout, theme, typography } from "../../theme";
import { getScreenBottomPadding, getScreenTopPadding } from "../../utils/screen";
import { WorkoutAvatar } from "./components/WorkoutAvatar";

type Props = NativeStackScreenProps<WorkoutsStackParamList, "WorkoutComplete">;

const DIFFICULTY_OPTIONS = ["Very Easy", "Easy", "Just Right", "Hard", "Brutal"];
const MOOD_OPTIONS = ["Tired", "Flat", "Good", "Great", "Electric"];

function formatSessionTime(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (durationSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function WorkoutCompleteScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);

  const summary = useMemo(
    () => ({
      durationSeconds: route.params.durationSeconds,
      setsCompleted: route.params.setsCompleted,
      calories: route.params.calories,
      volumeKg: route.params.volumeKg,
    }),
    [route.params.calories, route.params.durationSeconds, route.params.setsCompleted, route.params.volumeKg],
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: getScreenTopPadding(insets.top, theme.spacing.md),
          paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xl),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <WorkoutAvatar exercise="rest" isActive size={220} />
        <Text style={styles.heroTitle}>WORKOUT COMPLETE</Text>
        <Text style={styles.heroSubtitle}>You crushed it.</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{formatSessionTime(summary.durationSeconds)}</Text>
          <Text style={styles.statLabel}>TIME</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{summary.setsCompleted}</Text>
          <Text style={styles.statLabel}>SETS</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{summary.calories}</Text>
          <Text style={styles.statLabel}>KCAL</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{Math.round(summary.volumeKg)}</Text>
          <Text style={styles.statLabel}>VOLUME KG</Text>
        </View>
      </View>

      <View style={styles.ratingBlock}>
        <Text style={styles.ratingTitle}>How was that session?</Text>
        <View style={styles.optionRow}>
          {DIFFICULTY_OPTIONS.map((option) => (
            <Pressable
              key={option}
              onPress={() => setDifficulty(option)}
              style={[styles.optionChip, difficulty === option && styles.optionChipActive]}
            >
              <Text style={[styles.optionChipText, difficulty === option && styles.optionChipTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.ratingTitle}>Mood after</Text>
        <View style={styles.optionRow}>
          {MOOD_OPTIONS.map((option) => (
            <Pressable key={option} onPress={() => setMood(option)} style={[styles.optionChip, mood === option && styles.optionChipActive]}>
              <Text style={[styles.optionChipText, mood === option && styles.optionChipTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.aiFeedbackCard}>
        <CoachFullPanel
          feature="Workout Complete"
          pose="celebration"
          message="Strong session. Your set quality stayed stable through the final block. Next workout will progress slightly."
        />
      </View>

      <MoButton onPress={() => navigation.navigate("WorkoutsHome")}>Save And Go Home</MoButton>
      <MoButton onPress={() => navigation.navigate("WorkoutsHome")} variant="ghost">
        Adjust My Week
      </MoButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  content: {
    paddingHorizontal: layout.screen_padding_h,
    gap: theme.spacing.md,
  },
  hero: {
    alignItems: "center",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    padding: theme.spacing.md,
  },
  heroTitle: {
    ...typography.display_lg,
    color: colors.accent_green,
    textAlign: "center",
    marginTop: -6,
  },
  heroSubtitle: {
    ...typography.body_lg,
    color: colors.text_secondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  statCell: {
    width: "48%",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    padding: theme.spacing.md,
  },
  statValue: {
    ...typography.display_md,
    color: colors.accent_green,
  },
  statLabel: {
    ...typography.label,
    color: colors.text_secondary,
  },
  ratingBlock: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  ratingTitle: {
    ...typography.body_lg,
    color: colors.text_primary,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.border_strong,
    borderRadius: theme.radius.full,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: colors.bg_elevated,
  },
  optionChipActive: {
    borderColor: colors.accent_green,
    backgroundColor: colors.accent_green,
  },
  optionChipText: {
    ...typography.body_sm,
    color: colors.text_primary,
  },
  optionChipTextActive: {
    color: colors.text_inverse,
  },
  aiFeedbackCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: "rgba(200,241,53,0.12)",
    padding: theme.spacing.md,
  },
  aiFeedbackTitle: {
    ...typography.label,
    color: colors.accent_green,
  },
  aiFeedbackText: {
    ...typography.body_md,
    color: colors.text_primary,
    marginTop: 4,
  },
});
