import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Circle } from "react-native-svg";

import { theme } from "../../theme";

interface MacroPieChartProps {
  carbs: number;
  protein: number;
  fat: number;
}

const SIZE = 180;
const STROKE_WIDTH = 24;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MacroPieChart({ carbs, protein, fat }: MacroPieChartProps) {
  const total = Math.max(carbs + protein + fat, 1);
  const carbsLength = (carbs / total) * CIRCUMFERENCE;
  const proteinLength = (protein / total) * CIRCUMFERENCE;
  const fatLength = (fat / total) * CIRCUMFERENCE;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={theme.colors.surfaceSoft}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <Circle
          strokeDasharray={`${carbsLength} ${CIRCUMFERENCE}`}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={theme.colors.primary}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        <Circle
          strokeDasharray={`${proteinLength} ${CIRCUMFERENCE}`}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={theme.colors.primaryMuted}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDashoffset={-carbsLength}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        <Circle
          strokeDasharray={`${fatLength} ${CIRCUMFERENCE}`}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={theme.colors.neutral}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDashoffset={-(carbsLength + proteinLength)}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Carbs {carbs}g</Text>
        <Text style={styles.legendText}>Protein {protein}g</Text>
        <Text style={styles.legendText}>Fat {fat}g</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  legend: {
    marginTop: theme.spacing.sm,
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  legendText: {
    color: theme.colors.textMuted,
  },
});
