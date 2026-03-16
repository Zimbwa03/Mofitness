import { Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native-paper";

import { MoBadge } from "../../../components/common/MoBadge";
import { MoButton } from "../../../components/common/MoButton";
import type { WorkoutTemplate } from "../../../models/workout";
import { colors, theme, typography } from "../../../theme";

interface WorkoutCardProps {
  workout: WorkoutTemplate;
  delay?: number;
  compact?: boolean;
  onPress?: () => void;
  onStart?: () => void;
}

function getCategoryGradient(category: WorkoutTemplate["category"]) {
  switch (category) {
    case "strength":
      return ["rgba(200,241,53,0.28)", "rgba(20,20,20,0.95)"] as const;
    case "cardio":
      return ["rgba(10,132,255,0.3)", "rgba(20,20,20,0.95)"] as const;
    case "hiit":
      return ["rgba(255,59,48,0.3)", "rgba(20,20,20,0.95)"] as const;
    case "flexibility":
      return ["rgba(245,166,35,0.25)", "rgba(20,20,20,0.95)"] as const;
    case "recovery":
      return ["rgba(48,209,88,0.25)", "rgba(20,20,20,0.95)"] as const;
    case "sport":
      return ["rgba(255,214,10,0.28)", "rgba(20,20,20,0.95)"] as const;
    case "core":
    default:
      return ["rgba(138,138,138,0.22)", "rgba(20,20,20,0.95)"] as const;
  }
}

export function WorkoutCard({ workout, compact = false, onPress, onStart }: WorkoutCardProps) {
  return (
    <Animated.View style={[styles.container, compact && styles.compact]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        <LinearGradient colors={getCategoryGradient(workout.category)} style={[styles.cover, compact && styles.coverCompact]}>
          <Animated.View style={styles.coverTopRow}>
            <MoBadge
              variant={
                workout.difficulty === "advanced"
                  ? "red"
                  : workout.difficulty === "intermediate"
                    ? "amber"
                    : "green"
              }
            >
              {workout.difficulty}
            </MoBadge>
            <Animated.View style={styles.equipmentRow}>
              {workout.equipment.slice(0, 2).map((equipment) => (
                <MoBadge key={equipment} variant="gray">
                  {equipment.replace(/_/g, " ")}
                </MoBadge>
              ))}
            </Animated.View>
          </Animated.View>
          <Animated.View>
            <Text style={styles.title} numberOfLines={2}>
              {workout.name}
            </Text>
            <Text style={styles.meta}>
              {workout.durationMinutes} min · {workout.exercises.length} exercises · ~{workout.caloriesEstimate} kcal
            </Text>
          </Animated.View>
        </LinearGradient>

        <Animated.View style={styles.body}>
          <Animated.View style={styles.ratingRow}>
            <Text style={styles.ratingText}>STAR {workout.rating.toFixed(1)}</Text>
            <Text style={styles.metaSmall}>{workout.timesCompleted} sessions</Text>
          </Animated.View>

          <Text style={styles.quote} numberOfLines={2}>
            "{workout.motivationQuote}"
          </Text>

          <Animated.View style={styles.equipmentChipRow}>
            {workout.equipment.length === 0 ? (
              <MoBadge variant="gray">No equipment</MoBadge>
            ) : (
              workout.equipment.slice(0, 2).map((equipment) => (
                <MoBadge key={equipment} variant="gray">
                  {equipment.replace(/_/g, " ")}
                </MoBadge>
              ))
            )}
          </Animated.View>

          <Animated.View style={styles.actionRow}>
            <Text style={styles.category}>{workout.category.toUpperCase()}</Text>
            <MoButton onPress={onStart} size="small" variant="ghost">
              Start
            </MoButton>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    overflow: "hidden",
    marginBottom: theme.spacing.md,
  },
  compact: {
    width: 280,
    marginRight: theme.spacing.sm,
  },
  pressable: {
    width: "100%",
  },
  pressed: {
    opacity: 0.9,
  },
  cover: {
    height: 124,
    padding: theme.spacing.md,
    justifyContent: "space-between",
  },
  coverCompact: {
    height: 114,
  },
  coverTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  equipmentRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  title: {
    ...typography.display_sm,
    fontSize: 22,
    lineHeight: 24,
    color: colors.text_primary,
  },
  meta: {
    ...typography.body_sm,
    color: colors.text_secondary,
    marginTop: 4,
  },
  body: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingText: {
    ...typography.label,
    color: colors.accent_amber,
  },
  metaSmall: {
    ...typography.caption,
    color: colors.text_secondary,
  },
  quote: {
    ...typography.body_sm,
    color: colors.text_secondary,
    minHeight: 38,
  },
  equipmentChipRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    flexWrap: "wrap",
    minHeight: 30,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    ...typography.label,
    color: colors.accent_green,
  },
});
