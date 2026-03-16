import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { typography } from "../../../theme";
import { PaceChart } from "./PaceChart";
import { RunGoalRing } from "./RunGoalRing";

interface RunStatsPanelProps {
  distanceKm: number;
  paceLabel: string;
  elapsedLabel: string;
  bpm: number | null;
  steps: number;
  kcal: number;
  goalProgress: number;
  paceHistory: number[];
  flashKey?: number;
}

export function RunStatsPanel({
  distanceKm,
  paceLabel,
  elapsedLabel,
  bpm,
  steps,
  kcal,
  goalProgress,
  paceHistory,
  flashKey = 0,
}: RunStatsPanelProps) {
  const distanceScale = useRef(new Animated.Value(1)).current;
  const distanceTint = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(distanceScale, { toValue: 1.12, useNativeDriver: false, friction: 6 }),
        Animated.timing(distanceTint, { toValue: 1, duration: 140, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.spring(distanceScale, { toValue: 1, useNativeDriver: false, friction: 7 }),
        Animated.timing(distanceTint, { toValue: 0, duration: 240, useNativeDriver: false }),
      ]),
    ]).start();
  }, [distanceScale, distanceTint, flashKey]);

  const distanceColor = distanceTint.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFFFFF", "#C8F135"],
  });

  return (
    <View style={styles.panel}>
      <View style={styles.primary}>
        <View>
          <Animated.Text style={[styles.bigValue, { color: distanceColor, transform: [{ scale: distanceScale }] }]}>
            {distanceKm.toFixed(2)}
          </Animated.Text>
          <Text style={styles.bigLabel}>KM</Text>
        </View>
        <View>
          <Text style={styles.bigValue}>{paceLabel}</Text>
          <Text style={styles.bigLabel}>/KM PACE</Text>
        </View>
      </View>

      <View style={styles.secondary}>
        <Metric value={elapsedLabel} label="TIME" />
        <Metric value={bpm ? String(bpm) : "--"} label="BPM" />
        <Metric value={steps.toLocaleString()} label="STEPS" />
        <Metric value={String(kcal)} label="KCAL" />
      </View>

      <PaceChart values={paceHistory} />
      <View style={styles.goalWrap}>
        <RunGoalRing progress={goalProgress} />
      </View>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ ...typography.body_lg, color: "#FFF" }}>{value}</Text>
      <Text style={{ ...typography.caption, color: "#A8A8A8" }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "rgba(10,10,10,0.88)",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(200,241,53,0.15)",
    gap: 10,
  },
  primary: { flexDirection: "row", justifyContent: "space-between" },
  secondary: { flexDirection: "row", justifyContent: "space-between" },
  bigValue: { ...typography.display_md, color: "#FFF" },
  bigLabel: { ...typography.caption, color: "#F5A623" },
  goalWrap: { position: "absolute", right: 8, bottom: 8 },
});
