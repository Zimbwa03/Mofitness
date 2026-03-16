import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Text } from "react-native-paper";

import { MoButton } from "../common/MoButton";
import { colors, radius, theme, typography } from "../../theme";

interface WorkoutTimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
}

const SIZE = 180;
const STROKE_WIDTH = 12;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function WorkoutTimer({ initialSeconds = 60, onComplete }: WorkoutTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || seconds <= 0) {
      if (seconds === 0) {
        onComplete?.();
      }
      return;
    }

    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [onComplete, running, seconds]);

  const progress = seconds / initialSeconds;

  return (
    <View style={styles.container}>
      <View style={styles.ringWrap}>
        <Svg height={SIZE} width={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.bg_elevated}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.accent_green}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE * progress} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.center}>
          <Text style={styles.time}>{seconds}</Text>
          <Text style={styles.label}>REST</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <MoButton onPress={() => setRunning((value) => !value)} size="medium">
          {running ? "Pause" : "Start"}
        </MoButton>
        <MoButton onPress={() => setSeconds(0)} size="medium" variant="ghost">
          Skip Rest
        </MoButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
  },
  time: {
    ...typography.display_xl,
    color: colors.text_primary,
  },
  label: {
    ...typography.label,
    color: colors.accent_green,
    marginTop: -8,
  },
  actions: {
    width: "100%",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
});
