import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CoachFullPanel } from "../../components/coach/CoachFullPanel";
import { CoachMessageBubble } from "../../components/coach/CoachMessageBubble";
import { SimpleBarChart } from "../../components/charts/SimpleBarChart";
import { SimpleLineChart } from "../../components/charts/SimpleLineChart";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { InjuryRiskBanner } from "../../components/wellness/InjuryRiskBanner";
import { WellnessForm } from "../../components/wellness/WellnessForm";
import { useAuth } from "../../hooks/useAuth";
import { useWellness } from "../../hooks/useWellness";
import supabaseService from "../../services/SupabaseService";
import { colors, layout, theme, typography } from "../../theme";
import { getTabScreenBottomPadding } from "../../utils/screen";

export function WellnessScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { snapshot, setSnapshot } = useWellness();
  const [injuryRisk, setInjuryRisk] = useState(false);
  const [sleepTrend, setSleepTrend] = useState<Array<{ x: string; y: number }>>([]);
  const [loadTrend, setLoadTrend] = useState<Array<{ x: string; y: number }>>([]);

  const recentAverageSleep = useMemo(() => {
    if (sleepTrend.length === 0) {
      return null;
    }
    const total = sleepTrend.reduce((sum, item) => sum + item.y, 0);
    return total / sleepTrend.length;
  }, [sleepTrend]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const client = supabaseService.getClient();
    const loadMetrics = async () => {
      try {
        const today = new Date();
        const labels = Array.from({ length: 7 }, (_, index) => {
          const date = new Date(today);
          date.setDate(today.getDate() - (6 - index));
          return {
            iso: date.toISOString().slice(0, 10),
            day: date.toLocaleDateString(undefined, { weekday: "short" }),
          };
        });

        const [wellnessResult, workoutsResult] = await Promise.all([
          client
            .from("wellness_logs")
            .select("date, sleep_hours, stress_level")
            .eq("user_id", user.id)
            .gte("date", labels[0].iso)
            .order("date", { ascending: true }),
          client
            .from("user_workouts")
            .select("completed_date, calories_burned")
            .eq("user_id", user.id)
            .not("completed_date", "is", null)
            .gte("completed_date", labels[0].iso)
            .order("completed_date", { ascending: true }),
        ]);

        if (wellnessResult.error) {
          throw wellnessResult.error;
        }
        if (workoutsResult.error) {
          throw workoutsResult.error;
        }

        const wellnessRows = (wellnessResult.data ?? []) as Array<{ date: string; sleep_hours: number | null; stress_level: number | null }>;
        const workoutRows = (workoutsResult.data ?? []) as Array<{ completed_date: string | null; calories_burned: number | null }>;

        const sleepMap = new Map<string, number>();
        wellnessRows.forEach((row) => {
          if (row.sleep_hours !== null) {
            sleepMap.set(row.date, row.sleep_hours);
          }
        });

        const caloriesMap = new Map<string, number>();
        workoutRows.forEach((row) => {
          if (!row.completed_date) {
            return;
          }
          caloriesMap.set(row.completed_date, (caloriesMap.get(row.completed_date) ?? 0) + Number(row.calories_burned ?? 0));
        });

        setSleepTrend(labels.map((label) => ({ x: label.day, y: Number((sleepMap.get(label.iso) ?? 0).toFixed(1)) })));
        setLoadTrend(labels.map((label) => ({ x: label.day, y: Math.round(caloriesMap.get(label.iso) ?? 0) })));
      } catch (error) {
        console.error("Failed to load wellness trends", error);
      }
    };

    void loadMetrics();
  }, [user]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getTabScreenBottomPadding(insets.bottom) }]}
      showsVerticalScrollIndicator={false}
    >
      <MoCard variant="highlight">
        <Text style={styles.kicker}>Log today</Text>
        <Text style={styles.heading}>Mind and body status</Text>
        <Text style={styles.subheading}>Track sleep, hydration, stress, and mood in one pass.</Text>
        <WellnessForm
          initialValue={snapshot}
          onSubmit={async (value) => {
            setSnapshot(value);
            setInjuryRisk((value.stress_level ?? 0) >= 8 && (value.sleep_hours ?? 8) < 6);
            if (!user) {
              return;
            }
            try {
              const today = new Date().toISOString().slice(0, 10);
              await supabaseService
                .getClient()
                .from("wellness_logs")
                .insert({
                  user_id: user.id,
                  date: today,
                  sleep_hours: value.sleep_hours ?? null,
                  water_liters: value.water_liters ?? null,
                  stress_level: value.stress_level ?? null,
                  mood: value.mood ?? null,
                });
            } catch (error) {
              const message = error instanceof Error ? error.message : "Unable to save wellness log.";
              Alert.alert("Save Failed", message);
            }
          }}
        />
      </MoCard>
      <CoachMessageBubble
        feature="Wellness"
        pose={injuryRisk ? "warning" : "chat"}
        message={
          injuryRisk
            ? "I need you to hear this: your recovery markers are stressed. Pull intensity down and prioritize sleep tonight."
            : "Great check-in. I will use this to tune your workload and recovery targets."
        }
      />

      <InjuryRiskBanner visible={injuryRisk} />
      {injuryRisk ? (
        <CoachFullPanel
          feature="Wellness Alert"
          pose="warning"
          message="Your stress is high while sleep is low. Reduce training load today and focus on hydration plus recovery."
        />
      ) : null}

      <MoCard>
        <Text style={styles.kicker}>7-day trends</Text>
        <Text style={styles.chartTitle}>Sleep trend</Text>
        <SimpleLineChart data={sleepTrend.length > 0 ? sleepTrend : [{ x: "No data", y: 0 }]} />
      </MoCard>

      <MoCard variant="glass">
        <Text style={styles.chartTitle}>Weekly load</Text>
        <SimpleBarChart data={loadTrend.length > 0 ? loadTrend : [{ x: "No data", y: 0 }]} />
        <Text style={styles.supporting}>
          {recentAverageSleep === null
            ? "Log wellness entries to unlock recovery trend insights."
            : `Average sleep over last 7 days: ${recentAverageSleep.toFixed(1)}h.`}
        </Text>
      </MoCard>

      <MoCard>
        <Text style={styles.kicker}>AI wellness tips</Text>
        {[
          recentAverageSleep !== null && recentAverageSleep < 6.5
            ? "Your sleep trend is low this week. Swap one intense session for mobility and recovery."
            : "Sleep trend is stable. Keep a consistent bedtime to preserve recovery quality.",
          injuryRisk
            ? "Stress and sleep markers suggest high load risk. Reduce intensity and hydrate aggressively today."
            : "Keep logging wellness daily so workout and run intensity can stay personalized.",
          "Use a 10-minute breathing cooldown after training to reduce stress carryover.",
        ].map((tip) => (
          <View key={tip} style={styles.tipRow}>
            <View style={styles.tipIcon} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
        <MoButton variant="secondary">View Recovery Plan</MoButton>
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingBottom: theme.spacing.xxxl },
  kicker: { ...typography.label, color: colors.accent_green, marginBottom: theme.spacing.sm },
  heading: { ...typography.display_sm, marginBottom: theme.spacing.xs },
  subheading: { ...typography.body_md, color: colors.text_secondary, marginBottom: theme.spacing.md },
  chartTitle: { ...typography.body_xl, marginBottom: theme.spacing.sm },
  supporting: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.sm },
  tipRow: { flexDirection: "row", gap: theme.spacing.sm, alignItems: "flex-start", marginBottom: theme.spacing.md },
  tipIcon: { width: 10, height: 10, borderRadius: 5, marginTop: 6, backgroundColor: colors.accent_green },
  tipText: { ...typography.body_md, flex: 1, color: colors.text_secondary },
});
