import { useRef } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";

import type { RunSummarySnapshot } from "../../../models";
import { MoButton } from "../../../components/common/MoButton";
import { typography } from "../../../theme";

interface PostRunShareProps {
  summary: RunSummarySnapshot;
}

export function PostRunShare({ summary }: PostRunShareProps) {
  const shotRef = useRef<any>(null);

  const share = async () => {
    try {
      const uri = await shotRef.current?.capture?.();
      if (!uri) {
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate share card.";
      Alert.alert("Share failed", message);
    }
  };

  return (
    <View style={styles.wrap}>
      <ViewShot ref={shotRef} options={{ format: "png", quality: 0.95 }}>
        <View style={styles.card}>
          <Text style={styles.brand}>MO FITNESS</Text>
          <Text style={styles.km}>{(summary.distanceMeters / 1000).toFixed(2)} km</Text>
          <Text style={styles.meta}>
            {Math.round(summary.durationSeconds / 60)} min · {Math.round(summary.avgPaceSecPerKm / 60)}:{String(
              Math.round(summary.avgPaceSecPerKm % 60),
            ).padStart(2, "0")}
            /km
          </Text>
        </View>
      </ViewShot>
      <MoButton onPress={share}>Share Run</MoButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: {
    borderRadius: 14,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 14,
  },
  brand: { ...typography.label, color: "#C8F135" },
  km: { ...typography.display_md, color: "#FFF", marginTop: 4 },
  meta: { ...typography.body_sm, color: "#C0C0C0", marginTop: 6 },
});
