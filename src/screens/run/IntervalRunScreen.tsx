import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { colors, theme, typography } from "../../theme";
import { IntervalTracker } from "./components/IntervalTracker";

type IntervalTemplate = {
  id: string;
  name: string;
  sprintSec: number;
  recoverySec: number;
  rounds: number;
};

const templates: IntervalTemplate[] = [
  { id: "30_30", name: "30/30 Intervals", sprintSec: 30, recoverySec: 30, rounds: 10 },
  { id: "800_repeats", name: "800m Repeats", sprintSec: 180, recoverySec: 90, rounds: 4 },
  { id: "hill", name: "Hill Repeats", sprintSec: 50, recoverySec: 70, rounds: 6 },
];

export function IntervalRunScreen() {
  const [template, setTemplate] = useState<IntervalTemplate>(templates[0]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"sprint" | "recovery">("sprint");
  const [phaseLeft, setPhaseLeft] = useState(template.sprintSec);
  const [round, setRound] = useState(1);

  useEffect(() => {
    setPhase("sprint");
    setRound(1);
    setPhaseLeft(template.sprintSec);
  }, [template]);

  useEffect(() => {
    if (!running) {
      return;
    }
    const id = setInterval(() => {
      setPhaseLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        if (phase === "sprint") {
          setPhase("recovery");
          return template.recoverySec;
        }

        if (round >= template.rounds) {
          setRunning(false);
          return 0;
        }

        setRound((value) => value + 1);
        setPhase("sprint");
        return template.sprintSec;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, round, running, template.recoverySec, template.rounds, template.sprintSec]);

  const targetPace = useMemo(() => (phase === "sprint" ? "< 4:00/km" : "6:30/km"), [phase]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MoCard variant="highlight">
        <Text style={styles.section}>INTERVAL TEMPLATES</Text>
        <View style={styles.templates}>
          {templates.map((item) => (
            <MoButton key={item.id} variant={template.id === item.id ? "primary" : "ghost"} onPress={() => setTemplate(item)}>
              {item.name}
            </MoButton>
          ))}
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>ACTIVE INTERVAL DISPLAY</Text>
        <IntervalTracker phase={phase} current={round} total={template.rounds} />
        <View style={styles.countdownWrap}>
          <Text style={styles.phaseText}>{phase.toUpperCase()}</Text>
          <Text style={styles.timer}>{phaseLeft}s</Text>
          <Text style={styles.meta}>Target: {targetPace}</Text>
        </View>
        <View style={styles.row}>
          <MoButton variant={running ? "ghost" : "secondary"} onPress={() => setRunning((value) => !value)}>
            {running ? "Pause" : "Start"}
          </MoButton>
          <MoButton
            variant="ghost"
            onPress={() => {
              setRunning(false);
              setPhase("sprint");
              setRound(1);
              setPhaseLeft(template.sprintSec);
            }}
          >
            Reset
          </MoButton>
        </View>
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { padding: theme.spacing.md, gap: theme.spacing.md },
  section: { ...typography.label, color: colors.accent_green, marginBottom: 8 },
  templates: { gap: 8 },
  countdownWrap: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#111",
    alignItems: "center",
    paddingVertical: 20,
    gap: 6,
  },
  phaseText: { ...typography.body_lg, color: "#FFF", fontWeight: "700" },
  timer: { ...typography.display_lg, color: "#FFF" },
  meta: { ...typography.body_sm, color: colors.text_secondary },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
});
