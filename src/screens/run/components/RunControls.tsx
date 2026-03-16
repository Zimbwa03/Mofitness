import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { colors, theme, typography } from "../../../theme";

interface RunControlsProps {
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function RunControls({ paused, onPause, onResume, onStop }: RunControlsProps) {
  return (
    <View style={styles.row}>
      <Pressable style={[styles.btn, styles.secondary]} onPress={paused ? onResume : onPause}>
        <MaterialCommunityIcons name={paused ? "play" : "pause"} size={18} color="#FFF" />
        <Text style={styles.btnText}>{paused ? "Resume" : "Pause"}</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.stop]} onPress={onStop}>
        <MaterialCommunityIcons name="stop" size={18} color="#FFF" />
        <Text style={styles.btnText}>End</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.md },
  btn: {
    flex: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  secondary: { backgroundColor: colors.bg_surface },
  stop: { backgroundColor: "#A83D3D" },
  btnText: { ...typography.body_md, color: "#FFF", fontWeight: "700" },
});
