import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { typography } from "../../../theme";

interface SplitCardProps {
  km: number;
  split: string;
  hr: number | null;
  diff: string;
}

export function SplitCard({ km, split, hr, diff }: SplitCardProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.cell}>KM {km}</Text>
      <Text style={styles.cell}>{split}</Text>
      <Text style={styles.cell}>{hr ? `${hr} bpm` : "--"}</Text>
      <Text style={[styles.cell, diff.startsWith("-") ? styles.good : styles.warn]}>{diff}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#262626",
    backgroundColor: "#111",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cell: { ...typography.body_sm, color: "#FFF" },
  good: { color: "#C8F135" },
  warn: { color: "#F5A623" },
});
