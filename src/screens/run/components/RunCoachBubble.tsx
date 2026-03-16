import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { colors, typography } from "../../../theme";

interface RunCoachBubbleProps {
  message: string;
  onDismiss: () => void;
}

export function RunCoachBubble({ message, onDismiss }: RunCoachBubbleProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.avatar}>
        <MaterialCommunityIcons name="robot-excited-outline" size={16} color={colors.accent_green} />
      </View>
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onDismiss} style={styles.close}>
        <MaterialCommunityIcons name="close" size={14} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "rgba(24,24,24,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(200,241,53,0.1)",
  },
  message: { flex: 1, ...typography.body_sm, color: "#FFF" },
  close: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
});
