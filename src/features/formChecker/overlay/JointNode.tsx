import { Circle } from "react-native-svg";

interface JointNodeProps {
  cx: number;
  cy: number;
  color: string;
}

export function JointNode({ cx, cy, color }: JointNodeProps) {
  return <Circle cx={cx} cy={cy} r={6} fill={color} fillOpacity={0.92} />;
}
