import { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { Text } from "react-native-paper";

import type { CoachImageKey } from "../../assets/coaches";
import { useCoachImage } from "../../assets/coaches";
import { useCoachStore } from "../../stores/coachStore";
import { colors, theme, typography } from "../../theme";

interface CoachToastProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  pose?: CoachImageKey;
  durationMs?: number;
}

export function CoachToast({ visible, message, onDismiss, pose = "chat", durationMs = 4000 }: CoachToastProps) {
  const coachName = useCoachStore((state) => state.coachName);
  const image = useCoachImage(pose);
  const [mounted, setMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 80, friction: 9, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        onDismiss();
      }, durationMs);
      return () => clearTimeout(timer);
    }

    Animated.parallel([
      Animated.timing(translateY, { toValue: -40, duration: 160, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [durationMs, onDismiss, opacity, translateY, visible]);

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View style={[styles.shell, { opacity, transform: [{ translateY }] }]}>
      <BlurView intensity={35} tint="dark" style={styles.container}>
        <Image source={image} style={styles.avatar} accessibilityRole="image" accessibilityLabel={`${coachName} coach ${pose} pose`} />
        <Text numberOfLines={2} style={styles.message}>
          {message}
        </Text>
        <Pressable onPress={onDismiss} style={styles.close}>
          <Text style={styles.closeText}>x</Text>
        </Pressable>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: "rgba(30,30,30,0.85)",
    borderRadius: theme.radius.md,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  message: {
    flex: 1,
    ...typography.body_sm,
    color: colors.text_primary,
  },
  close: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
});

