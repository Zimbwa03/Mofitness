import { View } from "react-native";

interface PaceChartProps {
  values: number[];
  width?: number;
  height?: number;
}

export function PaceChart({ values, width = 320, height = 42 }: PaceChartProps) {
  if (values.length < 2) {
    return <View style={{ width, height }} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return (
    <View style={{ width, height, flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
      {values.slice(-30).map((value, idx) => {
        const normalized = (value - min) / range;
        return (
          <View
            key={`pace-${idx}-${value}`}
            style={{
              width: 4,
              height: Math.max(2, normalized * (height - 4)),
              backgroundColor: "#C8F135",
              borderRadius: 2,
              opacity: 0.85,
            }}
          />
        );
      })}
    </View>
  );
}
