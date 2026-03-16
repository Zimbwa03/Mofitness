import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { CoachFullPanel } from "../../components/coach/CoachFullPanel";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { useAuth } from "../../hooks/useAuth";
import type { DashboardStackParamList } from "../../navigation/types";
import runService from "../../services/RunService";
import { colors, theme, typography } from "../../theme";
import { ElevationProfile } from "./components/ElevationProfile";
import { PostRunShare } from "./components/PostRunShare";
import { SplitCard } from "./components/SplitCard";

type Props = NativeStackScreenProps<DashboardStackParamList, "RunSummary">;

export function RunSummaryScreen({ route, navigation }: Props) {
  const { user } = useAuth();
  const { summary, routePoints } = route.params;

  const paceBars = useMemo(
    () =>
      summary.kmSplits.map((split) => ({
        x: split.km,
        y: split.paceSec,
      })),
    [summary.kmSplits],
  );

  const elevationData = useMemo(
    () =>
      routePoints.map((point, idx) => ({
        x: idx,
        y: point.alt,
      })),
    [routePoints],
  );

  const save = async () => {
    if (!user) {
      return;
    }
    await runService.saveRunSession({
      userId: user.id,
      activityType: "outdoor_run",
      startedAt: new Date(Date.now() - summary.durationSeconds * 1000).toISOString(),
      endedAt: new Date().toISOString(),
      summary,
      routePoints,
      kmSplits: summary.kmSplits,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MoCard variant="highlight">
        <Text style={styles.mainDistance}>{(summary.distanceMeters / 1000).toFixed(2)} KM</Text>
        <Text style={styles.body}>Outdoor Run</Text>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>PRIMARY STATS</Text>
        <View style={styles.statRow}>
          <Metric label="TIME" value={`${Math.round(summary.durationSeconds / 60)} min`} />
          <Metric
            label="/KM AVG"
            value={`${Math.floor(summary.avgPaceSecPerKm / 60)}:${String(Math.round(summary.avgPaceSecPerKm % 60)).padStart(2, "0")}`}
          />
          <Metric label="KCAL" value={String(summary.caloriesBurned)} />
        </View>
        <View style={styles.statRow}>
          <Metric label="STEPS" value={summary.totalSteps.toLocaleString()} />
          <Metric label="AVG HR" value={summary.avgHeartRateBpm ? `${summary.avgHeartRateBpm}` : "--"} />
          <Metric label="ELEV" value={`${Math.round(summary.elevationGainM)}m`} />
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>PACE PER KM</Text>
        <View style={styles.paceChart}>
          {paceBars.map((bar) => {
            const normalized = Math.max(0.1, Math.min(1, (bar.y || 1) / Math.max(1, summary.avgPaceSecPerKm * 1.4)));
            return <View key={`pace-${bar.x}`} style={[styles.paceBar, { height: `${normalized * 100}%` }]} />;
          })}
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>SPLITS</Text>
        <View style={{ gap: 8 }}>
          {summary.kmSplits.map((split) => (
            <SplitCard
              key={`split-${split.km}`}
              km={split.km}
              split={`${Math.floor(split.paceSec / 60)}:${String(Math.round(split.paceSec % 60)).padStart(2, "0")}`}
              hr={split.hr}
              diff={`${split.paceSec - summary.avgPaceSecPerKm > 0 ? "+" : "-"}${Math.abs(Math.round(split.paceSec - summary.avgPaceSecPerKm))}s`}
            />
          ))}
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>ELEVATION PROFILE</Text>
        <ElevationProfile data={elevationData} />
      </MoCard>

      <MoCard variant="glass">
        <CoachFullPanel
          feature="Run Analysis"
          pose={summary.distanceMeters >= 10000 ? "celebration" : "chat"}
          message="Strong work. Your average pace stayed consistent across most splits and your heart rate profile remained in a productive zone."
        />
      </MoCard>

      <PostRunShare summary={summary} />
      <View style={styles.row}>
        <MoButton variant="secondary" onPress={() => void save()}>
          Save Session
        </MoButton>
        <MoButton variant="ghost" onPress={() => navigation.navigate("RunHistory")}>
          View History
        </MoButton>
        <MoButton variant="ghost" onPress={() => navigation.navigate("DashboardHome")}>
          Done
        </MoButton>
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { padding: theme.spacing.md, gap: theme.spacing.md },
  mainDistance: { ...typography.display_lg, color: colors.accent_green },
  section: { ...typography.label, color: colors.accent_green, marginBottom: 8 },
  body: { ...typography.body_sm, color: colors.text_secondary },
  statRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  metric: { alignItems: "center", flex: 1 },
  metricValue: { ...typography.body_lg, color: "#FFF" },
  metricLabel: { ...typography.caption, color: colors.text_secondary },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  paceChart: {
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#282828",
    backgroundColor: "#111",
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  paceBar: {
    width: 18,
    borderRadius: 6,
    backgroundColor: "#C8F135",
  },
});
