import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text } from "react-native-paper";

import { CoachFullPanel } from "../../components/coach/CoachFullPanel";
import { SimpleBarChart } from "../../components/charts/SimpleBarChart";
import { SimpleLineChart } from "../../components/charts/SimpleLineChart";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import type { DashboardStackParamList } from "../../navigation/types";
import { colors, theme, typography } from "../../theme";
import { useFormCheckerStore } from "./stores/formCheckerStore";

type Props = NativeStackScreenProps<DashboardStackParamList, "FormCheckerSummary">;

const ringColor = (score: number) => (score >= 80 ? colors.accent_green : score >= 60 ? colors.accent_amber : colors.error);

export function FormCheckerSummaryScreen({ navigation }: Props) {
  const session = useFormCheckerStore((state) => state.lastSession);
  const history = useFormCheckerStore((state) => state.history);

  const comparison = useMemo(() => {
    if (!session) {
      return null;
    }
    const previous = history.find((item) => item.id !== session.id && item.exerciseId === session.exerciseId);
    if (!previous) {
      return null;
    }
    return session.overallScore - previous.overallScore;
  }, [history, session]);

  if (!session) {
    return (
      <View style={styles.empty}>
        <Text style={styles.title}>No session summary available.</Text>
        <MoButton onPress={() => navigation.navigate("FormCheckerSetup")}>Start Form Checker</MoButton>
      </View>
    );
  }

  const repLineData = session.setBreakdown.flatMap((setSummary) =>
    setSummary.repQuality.map((score, index) => ({
      x: `${setSummary.setNumber}.${index + 1}`,
      y: score,
    })),
  );
  const filteredHistory = history.filter((item) => item.exerciseId === session.exerciseId).slice(0, 8).reverse();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <MoCard variant="highlight">
        <Text style={styles.section}>FORM ANALYSIS</Text>
        <Text style={styles.title}>{session.exerciseName}</Text>
        <Text style={styles.body}>{new Date(session.performedAt).toDateString()} · {session.setsCompleted} sets completed</Text>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>OVERALL FORM SCORE</Text>
        <View style={styles.ringWrap}>
          <ScoreRing score={session.overallScore} />
          <View style={styles.ringText}>
            <Text style={styles.ringValue}>{session.overallScore}%</Text>
            <Text style={styles.ringLabel}>OVERALL FORM</Text>
          </View>
        </View>
        {comparison !== null ? (
          <Text style={[styles.body, { color: comparison >= 0 ? colors.accent_green : colors.accent_amber }]}>
            {comparison >= 0 ? "▲" : "▼"} {Math.abs(comparison)}% vs last time
          </Text>
        ) : null}
      </MoCard>

      <MoCard>
        <Text style={styles.section}>SET BREAKDOWN</Text>
        {session.setBreakdown.map((setSummary) => (
          <View key={`set-${setSummary.setNumber}`} style={styles.setRow}>
            <Text style={styles.setLabel}>Set {setSummary.setNumber}</Text>
            <View style={styles.setBarTrack}>
              <View style={[styles.setBarFill, { width: `${setSummary.averageScore}%`, backgroundColor: ringColor(setSummary.averageScore) }]} />
            </View>
            <Text style={styles.setScore}>{setSummary.averageScore}%</Text>
          </View>
        ))}
      </MoCard>

      <MoCard>
        <Text style={styles.section}>REP BY REP FORM SCORE</Text>
        <SimpleLineChart data={repLineData.length > 0 ? repLineData : [{ x: "1", y: session.overallScore }]} />
      </MoCard>

      <MoCard>
        <Text style={styles.section}>WHAT NEEDS WORK</Text>
        {session.topIssues.length === 0 ? (
          <Text style={styles.body}>No persistent fault pattern was recorded in this set.</Text>
        ) : (
          session.topIssues.slice(0, 3).map((issue, index) => (
            <View key={issue.id} style={styles.issueCard}>
              <View style={styles.issueHeader}>
                <Text style={styles.issueTitle}>
                  {index + 1}. {issue.cue}
                </Text>
                <Text style={[styles.issueCount, { color: issue.severity === "critical" ? colors.error : issue.severity === "warning" ? colors.accent_amber : colors.accent_green }]}>
                  {issue.count} hits
                </Text>
              </View>
              <Text style={styles.body}>{issue.fix}</Text>
            </View>
          ))
        )}
      </MoCard>

      <MoCard variant="glass">
        <CoachFullPanel
          feature="Form Analysis"
          pose={session.overallScore >= 80 ? "chat" : "warning"}
          message={session.coach?.spoken_summary ?? "I am still generating a deeper analysis for this set."}
        />
        {session.coach?.drill_suggestion ? <Text style={styles.drill}>Fix next: {session.coach.drill_suggestion}</Text> : null}
      </MoCard>

      <MoCard>
        <Text style={styles.section}>YOUR FORM OVER TIME</Text>
        <SimpleBarChart
          data={(filteredHistory.length > 0 ? filteredHistory : [session]).map((item, index) => ({
            x: `S${index + 1}`,
            y: item.overallScore,
          }))}
        />
      </MoCard>

      <View style={styles.actions}>
        <MoButton variant="secondary" onPress={() => navigation.navigate("FormCheckerHistory")} style={styles.actionButton}>
          View History
        </MoButton>
        <MoButton onPress={() => navigation.navigate("DashboardHome")} style={styles.actionButton}>
          Save & Continue
        </MoButton>
      </View>
    </ScrollView>
  );
}

function ScoreRing({ score }: { score: number }) {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} fill="transparent" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <Circle
        cx={size / 2}
        cy={size / 2}
        fill="transparent"
        r={radius}
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
        stroke={ringColor(score)}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={progress}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { padding: theme.spacing.md, gap: theme.spacing.md },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    backgroundColor: colors.bg_primary,
    gap: theme.spacing.md,
  },
  section: { ...typography.label, color: colors.accent_green, marginBottom: theme.spacing.xs },
  title: { ...typography.display_sm, marginBottom: theme.spacing.xs },
  body: { ...typography.body_md, color: colors.text_secondary },
  ringWrap: { alignItems: "center", justifyContent: "center", marginVertical: theme.spacing.md },
  ringText: { position: "absolute", alignItems: "center" },
  ringValue: { ...typography.display_md, color: colors.text_primary },
  ringLabel: { ...typography.caption, color: colors.text_secondary },
  setRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  setLabel: { ...typography.body_md, color: colors.text_primary, width: 54 },
  setBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.bg_elevated,
    overflow: "hidden",
  },
  setBarFill: { height: "100%", borderRadius: 999 },
  setScore: { ...typography.body_sm, color: colors.text_primary, width: 44, textAlign: "right" },
  issueCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_elevated,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  issueHeader: { flexDirection: "row", justifyContent: "space-between", gap: theme.spacing.sm, marginBottom: theme.spacing.xs },
  issueTitle: { ...typography.body_lg, color: colors.text_primary, flex: 1 },
  issueCount: { ...typography.body_sm },
  drill: { ...typography.body_sm, color: colors.accent_green, marginTop: theme.spacing.sm },
  actions: { flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  actionButton: { flex: 1 },
});
