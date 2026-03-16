import Svg, { Line, Path, Text as SvgText } from "react-native-svg";

import { theme } from "../../theme";

interface Datum {
  x: string;
  y: number;
}

interface SimpleLineChartProps {
  data: Datum[];
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 220;
const PADDING = 24;

export function SimpleLineChart({ data }: SimpleLineChartProps) {
  const maxValue = Math.max(...data.map((item) => item.y), 1);
  const minValue = Math.min(...data.map((item) => item.y), 0);
  const span = Math.max(maxValue - minValue, 1);
  const drawableWidth = CHART_WIDTH - PADDING * 2;
  const drawableHeight = CHART_HEIGHT - PADDING * 2;

  const points = data.map((item, index) => {
    const x = PADDING + (index / Math.max(data.length - 1, 1)) * drawableWidth;
    const y = CHART_HEIGHT - PADDING - ((item.y - minValue) / span) * drawableHeight;
    return { ...item, xCoord: x, yCoord: y };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.xCoord} ${point.yCoord}`)
    .join(" ");

  return (
    <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
      <Line
        x1={PADDING}
        y1={CHART_HEIGHT - PADDING}
        x2={CHART_WIDTH - PADDING}
        y2={CHART_HEIGHT - PADDING}
        stroke={theme.colors.border}
        strokeWidth={1}
      />
      <Path d={path} stroke={theme.colors.primary} strokeWidth={3} fill="none" />
      {points.map((point) => (
        <SvgText
          key={`${point.x}-label`}
          x={point.xCoord}
          y={CHART_HEIGHT - 8}
          fill={theme.colors.textMuted}
          fontSize={10}
          textAnchor="middle"
        >
          {point.x}
        </SvgText>
      ))}
    </Svg>
  );
}
