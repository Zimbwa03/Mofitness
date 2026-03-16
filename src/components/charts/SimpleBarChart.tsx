import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";

import { theme } from "../../theme";

interface Datum {
  x: string;
  y: number;
}

interface SimpleBarChartProps {
  data: Datum[];
}

const CHART_WIDTH = 320;
const CHART_HEIGHT = 220;
const PADDING = 24;

export function SimpleBarChart({ data }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.y), 1);
  const barWidth = (CHART_WIDTH - PADDING * 2) / Math.max(data.length * 1.4, 1);
  const gap = barWidth * 0.4;
  const drawableHeight = CHART_HEIGHT - PADDING * 2;

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
      {data.map((item, index) => {
        const barHeight = (item.y / maxValue) * drawableHeight;
        const x = PADDING + index * (barWidth + gap);
        const y = CHART_HEIGHT - PADDING - barHeight;

        return (
          <Rect
            key={item.x}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            fill={theme.colors.primaryMuted}
            rx={6}
          />
        );
      })}
      {data.map((item, index) => (
        <SvgText
          key={`${item.x}-label`}
          x={PADDING + index * (barWidth + gap) + barWidth / 2}
          y={CHART_HEIGHT - 8}
          fill={theme.colors.textMuted}
          fontSize={10}
          textAnchor="middle"
        >
          {item.x}
        </SvgText>
      ))}
    </Svg>
  );
}
