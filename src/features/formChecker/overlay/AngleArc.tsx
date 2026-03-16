import { Circle } from "react-native-svg";

interface AngleArcProps {
  cx: number;
  cy: number;
  color: string;
}

export function AngleArc({ cx, cy, color }: AngleArcProps) {
  return <Circle cx={cx} cy={cy} r={16} stroke={color} strokeWidth={3} strokeDasharray="30 24" fill="transparent" />;
}
