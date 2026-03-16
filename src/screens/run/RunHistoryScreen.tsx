import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { useAuth } from "../../hooks/useAuth";
import type { RunSession } from "../../models";
import runService from "../../services/RunService";
import { colors, theme, typography } from "../../theme";

type Period = "week" | "month" | "quarter" | "all";

export function RunHistoryScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("week");
  const [runs, setRuns] = useState<RunSession[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }
    runService.getRecentRuns(user.id, 60).then(setRuns).catch(() => undefined);
  }, [user]);

  const filtered = useMemo(() => {
    const days = period === "week" ? 7 : period === "month" ? 30 : period === "quarter" ? 90 : 3650;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return runs.filter((run) => new Date(run.started_at).getTime() >= cutoff);
  }, [period, runs]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, run) => {
          acc.distance += run.distance_meters ?? 0;
          acc.duration += run.duration_seconds ?? 0;
          return acc;
        },
        { distance: 0, duration: 0 },
      ),
    [filtered],
  );

  const paceTrend = useMemo(
    () =>
      filtered
        .slice()
        .reverse()
        .map((run, index) => ({ x: index + 1, y: run.avg_pace_sec_per_km ?? 0 })),
    [filtered],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.tabs}>
        <PeriodButton label="WEEK" active={period === "week"} onPress={() => setPeriod("week")} />
        <PeriodButton label="MONTH" active={period === "month"} onPress={() => setPeriod("month")} />
        <PeriodButton label="3 MONTHS" active={period === "quarter"} onPress={() => setPeriod("quarter")} />
        <PeriodButton label="ALL" active={period === "all"} onPress={() => setPeriod("all")} />
      </View>

      <MoCard variant="highlight">
        <Text style={styles.section}>SUMMARY</Text>
        <Text style={styles.kpi}>
          {(totals.distance / 1000).toFixed(1)} km · {Math.round(totals.duration / 60)} min · {filtered.length} runs
        </Text>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>PACE TREND</Text>
        <View style={styles.trendChart}>
          {paceTrend.map((item) => {
            const normalized = Math.max(0.1, Math.min(1, (item.y || 1) / 650));
            return <View key={`trend-${item.x}`} style={[styles.trendBar, { height: `${normalized * 100}%` }]} />;
          })}
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>PAST RUNS</Text>
        <View style={{ gap: 8 }}>
          {filtered.slice(0, 20).map((run) => (
            <View key={run.id} style={styles.runRow}>
              <View>
                <Text style={styles.runTitle}>{new Date(run.started_at).toDateString()}</Text>
                <Text style={styles.runMeta}>
                  {((run.distance_meters ?? 0) / 1000).toFixed(2)}km · {Math.round((run.duration_seconds ?? 0) / 60)} min
                </Text>
              </View>
              <Text style={styles.runPace}>
                {(run.avg_pace_sec_per_km ?? 0) > 0
                  ? `${Math.floor((run.avg_pace_sec_per_km ?? 0) / 60)}:${String(Math.round((run.avg_pace_sec_per_km ?? 0) % 60)).padStart(2, "0")}/km`
                  : "--"}
              </Text>
            </View>
          ))}
        </View>
      </MoCard>
    </ScrollView>
  );
}

function PeriodButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <MoButton variant={active ? "primary" : "ghost"} onPress={onPress}>
      {label}
    </MoButton>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { padding: theme.spacing.md, gap: theme.spacing.md },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  section: { ...typography.label, color: colors.accent_green, marginBottom: 8 },
  kpi: { ...typography.body_lg, color: "#FFF" },
  runRow: {
    borderWidth: 1,
    borderColor: "#282828",
    borderRadius: 12,
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  runTitle: { ...typography.body_sm, color: "#FFF", fontWeight: "700" },
  runMeta: { ...typography.caption, color: colors.text_secondary, marginTop: 3 },
  runPace: { ...typography.body_sm, color: colors.accent_amber },
  trendChart: {
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#111",
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  trendBar: {
    width: 6,
    borderRadius: 4,
    backgroundColor: "#C8F135",
    opacity: 0.8,
  },
});
