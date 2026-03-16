import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { typography } from "../../../theme";

interface IntervalTrackerProps {
  phase: "sprint" | "recovery" | "rest";
  current: number;
  total: number;
}

export function IntervalTracker({ phase, current, total }: IntervalTrackerProps) {
  const progress = total > 0 ? current / total : 0;
  const color = phase === "sprint" ? "#D9534F" : phase === "recovery" ? "#C8F135" : "#F5A623";

  return (
    <View style={styles.wrap}>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.text}>
        {phase.toUpperCase()} {current}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  barBg: { height: 10, borderRadius: 8, backgroundColor: "#2A2A2A", overflow: "hidden" },
  barFill: { height: "100%" },
  text: { ...typography.body_sm, color: "#FFF", fontWeight: "700" },
});
