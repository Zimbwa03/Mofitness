import { View } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Circle } from "react-native-svg";

import { typography } from "../../../theme";

interface RunGoalRingProps {
  progress: number;
}

export function RunGoalRing({ progress }: RunGoalRingProps) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - safeProgress);

  return (
    <View style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center" }}>
      <Svg width={56} height={56}>
        <Circle cx={28} cy={28} r={radius} stroke="#2A2A2A" strokeWidth={6} fill="none" />
        <Circle
          cx={28}
          cy={28}
          r={radius}
          stroke="#C8F135"
          strokeWidth={6}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      </Svg>
      <Text style={{ ...typography.caption, color: "#FFF", position: "absolute" }}>{Math.round(safeProgress * 100)}%</Text>
    </View>
  );
}
