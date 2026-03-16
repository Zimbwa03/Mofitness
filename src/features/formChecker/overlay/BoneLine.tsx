import { Line } from "react-native-svg";

interface BoneLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export function BoneLine({ x1, y1, x2, y2, color }: BoneLineProps) {
  return <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={3} strokeOpacity={0.82} strokeLinecap="round" />;
}
