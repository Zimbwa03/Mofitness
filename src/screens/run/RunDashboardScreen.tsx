import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { CoachFullPanel } from "../../components/coach/CoachFullPanel";
import { MoBadge } from "../../components/common/MoBadge";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { useAuth } from "../../hooks/useAuth";
import type { RunActivityType, SavedRoute, WeeklyRunSummary } from "../../models";
import runService from "../../services/RunService";
import { colors, theme, typography } from "../../theme";
import type { DashboardStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<DashboardStackParamList, "RunDashboard">;

const activities: Array<{ type: RunActivityType; icon: string; label: string }> = [
  { type: "outdoor_run", icon: "🏃", label: "Run" },
  { type: "walk", icon: "🚶", label: "Walk" },
  { type: "outdoor_cycle", icon: "🚴", label: "Cycle" },
  { type: "trail_run", icon: "🏞️", label: "Trail" },
  { type: "treadmill", icon: "🏋️", label: "Treadmill" },
  { type: "interval_run", icon: "⚡", label: "Intervals" },
];

const emptySummary: WeeklyRunSummary = { runs: 0, distanceMeters: 0, steps: 0, calories: 0, weeklyGoalMeters: 20000 };

export function RunDashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [activity, setActivity] = useState<RunActivityType>("outdoor_run");
  const [summary, setSummary] = useState<WeeklyRunSummary>(emptySummary);
  const [nearbyRoutes, setNearbyRoutes] = useState<SavedRoute[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    runService.syncQueuedRuns().catch(() => undefined);
    runService.getWeeklySummary(user.id, weekStart.toISOString()).then(setSummary).catch(() => undefined);
    runService.getRoutesNearMe("ZW", "Harare").then(setNearbyRoutes).catch(() => undefined);
  }, [user]);

  const goalProgress = summary.weeklyGoalMeters > 0 ? Math.min(1, summary.distanceMeters / summary.weeklyGoalMeters) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <MoCard variant="highlight">
        <Text style={styles.section}>THIS WEEK</Text>
        <View style={styles.grid}>
          <Stat label="Runs" value={String(summary.runs)} />
          <Stat label="Distance" value={`${(summary.distanceMeters / 1000).toFixed(1)} km`} />
          <Stat label="Steps" value={summary.steps.toLocaleString()} />
          <Stat label="Calories" value={String(summary.calories)} />
        </View>
        <Text style={styles.goalText}>
          {(summary.distanceMeters / 1000).toFixed(1)} / {(summary.weeklyGoalMeters / 1000).toFixed(0)} km weekly goal
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${goalProgress * 100}%` }]} />
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>WHAT ARE YOU DOING TODAY?</Text>
        <View style={styles.activityGrid}>
          {activities.map((item) => {
            const selected = activity === item.type;
            return (
              <MoButton
                key={item.type}
                variant={selected ? "primary" : "ghost"}
                onPress={() => setActivity(item.type)}
                style={styles.activityBtn}
              >{`${item.icon} ${item.label}`}</MoButton>
            );
          })}
        </View>
      </MoCard>

      <MoCard variant="glass">
        <CoachFullPanel
          feature="Run"
          pose="sprint"
          message="Easy 4km run at recovery pace. Your previous workload was high, so keep this one smooth and aerobic."
          actionLabel="See Route On Map"
          onActionPress={() => navigation.navigate("RouteDiscovery", { activityType: activity })}
        />
      </MoCard>

      <MoCard>
        <View style={styles.inlineHead}>
          <Text style={styles.section}>ROUTES NEAR YOU</Text>
          <MoBadge variant="amber">Near me</MoBadge>
        </View>
        <View style={styles.routesRow}>
          {nearbyRoutes.slice(0, 4).map((route) => (
            <View key={route.id} style={styles.routeChip}>
              <Text style={styles.routeName}>{route.name}</Text>
              <Text style={styles.routeMeta}>{((route.distance_meters ?? 0) / 1000).toFixed(1)} km</Text>
            </View>
          ))}
        </View>
      </MoCard>

      <MoButton
        onPress={() =>
          activity === "interval_run"
            ? navigation.navigate("IntervalRun")
            : navigation.navigate("RunSetup", { activityType: activity })
        }
        style={{ marginBottom: theme.spacing.lg }}
      >{`Start ${activity.replace("_", " ").toUpperCase()}`}</MoButton>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { padding: theme.spacing.md, gap: theme.spacing.md },
  section: { ...typography.label, color: colors.accent_green, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: { width: "48%", borderWidth: 1, borderColor: colors.border_subtle, borderRadius: 12, padding: 10, backgroundColor: colors.bg_surface },
  statValue: { ...typography.body_xl, color: "#FFF" },
  statLabel: { ...typography.caption, color: colors.text_secondary },
  goalText: { ...typography.caption, color: colors.text_secondary, marginTop: 10 },
  progressTrack: { marginTop: 6, height: 8, borderRadius: 8, backgroundColor: "#232323", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.accent_green },
  activityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  activityBtn: { width: "48%" },
  body: { ...typography.body_sm, color: colors.text_secondary },
  inlineHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  routeChip: { borderRadius: 10, padding: 10, backgroundColor: "#171717", borderWidth: 1, borderColor: "#2B2B2B", minWidth: "48%" },
  routeName: { ...typography.body_sm, color: "#FFF" },
  routeMeta: { ...typography.caption, color: colors.text_secondary, marginTop: 4 },
});
