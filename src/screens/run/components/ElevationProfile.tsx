import { StyleSheet, View } from "react-native";

interface ElevationProfileProps {
  data: Array<{ x: number; y: number }>;
}

export function ElevationProfile({ data }: ElevationProfileProps) {
  if (data.length === 0) {
    return null;
  }

  const min = Math.min(...data.map((point) => point.y));
  const max = Math.max(...data.map((point) => point.y));
  const range = Math.max(1, max - min);

  return (
    <View style={styles.chart}>
      {data.slice(-60).map((point, index) => (
        <View
          key={`elev-${index}-${point.x}`}
          style={[
            styles.bar,
            {
              height: Math.max(4, ((point.y - min) / range) * 100),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: 110,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#262626",
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: "#C8F135",
    opacity: 0.8,
  },
});
