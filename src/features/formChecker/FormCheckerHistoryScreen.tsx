import { ScrollView, StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text } from "react-native-paper";

import { SimpleBarChart } from "../../components/charts/SimpleBarChart";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import type { DashboardStackParamList } from "../../navigation/types";
import { colors, theme, typography } from "../../theme";
import { defaultExerciseConfig, exerciseLookup } from "./exercises";
import { useFormCheckerStore } from "./stores/formCheckerStore";

type Props = NativeStackScreenProps<DashboardStackParamList, "FormCheckerHistory">;

export function FormCheckerHistoryScreen({ navigation }: Props) {
  const config = useFormCheckerStore((state) => state.config);
  const history = useFormCheckerStore((state) => state.history);
  const selectedExercise = exerciseLookup[config.exerciseId] ?? defaultExerciseConfig;
  const filteredHistory = history.filter((item) => item.exerciseId === selectedExercise.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <MoCard variant="highlight">
        <Text style={styles.section}>FORM HISTORY</Text>
        <Text style={styles.title}>{selectedExercise.name}</Text>
        <Text style={styles.body}>Track how your movement quality changes session to session.</Text>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>LAST 8 SESSIONS</Text>
        <SimpleBarChart
          data={(filteredHistory.length > 0 ? filteredHistory : history)
            .slice(0, 8)
            .reverse()
            .map((session, index) => ({
              x: `S${index + 1}`,
              y: session.overallScore,
            }))}
        />
      </MoCard>

      {(filteredHistory.length > 0 ? filteredHistory : history).map((session) => (
        <MoCard key={session.id}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionTitle}>{session.exerciseName}</Text>
              <Text style={styles.body}>{new Date(session.performedAt).toDateString()}</Text>
            </View>
            <Text style={[styles.score, { color: session.overallScore >= 80 ? colors.accent_green : session.overallScore >= 60 ? colors.accent_amber : colors.error }]}>
              {session.overallScore}%
            </Text>
          </View>
          <Text style={styles.body}>{session.setsCompleted} sets completed.</Text>
          {session.topIssues.slice(0, 2).map((issue) => (
            <Text key={`${session.id}-${issue.id}`} style={styles.issueLine}>
              • {issue.cue}: {issue.count} hits
            </Text>
          ))}
        </MoCard>
      ))}

      <MoButton onPress={() => navigation.navigate("FormCheckerSetup")} style={{ marginBottom: theme.spacing.lg }}>
        Start New Session
      </MoButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { padding: theme.spacing.md, gap: theme.spacing.md },
  section: { ...typography.label, color: colors.accent_green, marginBottom: theme.spacing.xs },
  title: { ...typography.display_sm, marginBottom: theme.spacing.xs },
  body: { ...typography.body_md, color: colors.text_secondary },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.spacing.md },
  sessionTitle: { ...typography.body_xl, color: colors.text_primary },
  score: { ...typography.display_sm },
  issueLine: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.xs },
});
