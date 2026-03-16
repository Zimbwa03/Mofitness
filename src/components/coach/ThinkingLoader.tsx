import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { useCoachImage } from "../../assets/coaches";
import { useCoachStore } from "../../stores/coachStore";
import { colors, theme, typography } from "../../theme";

const maleMessages = [
  "Mo is analysing your data...",
  "Mo is building your plan...",
  "Mo is checking your form history...",
  "Mo is finding the best meals for you...",
  "Mo is calculating your targets...",
  "Almost ready...",
];

const femaleMessages = [
  "Nia is analysing your data...",
  "Nia is designing your plan...",
  "Nia is reviewing your progress...",
  "Nia is personalising your meals...",
  "Nia is calculating your targets...",
  "Almost ready...",
];

export function ThinkingLoader() {
  const selectedCoach = useCoachStore((state) => state.selectedCoach);
  const image = useCoachImage("thinking");
  const [index, setIndex] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  const messages = useMemo(() => (selectedCoach === "male" ? maleMessages : femaleMessages), [selectedCoach]);

  useEffect(() => {
    const swap = setInterval(() => setIndex((prev) => (prev + 1) % messages.length), 1500);
    const dots = setInterval(() => setDotCount((prev) => (prev >= 3 ? 1 : prev + 1)), 420);
    return () => {
      clearInterval(swap);
      clearInterval(dots);
    };
  }, [messages]);

  return (
    <View style={styles.container}>
      <Image source={image} style={styles.avatar} accessibilityRole="image" accessibilityLabel="Coach thinking pose" />
      <Text style={styles.text}>{messages[index]}</Text>
      <Text style={styles.dots}>{".".repeat(dotCount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.accent_green,
  },
  text: {
    ...typography.body_md,
    color: colors.text_primary,
    textAlign: "center",
  },
  dots: {
    ...typography.body_lg,
    color: colors.accent_green,
    lineHeight: 18,
  },
});

