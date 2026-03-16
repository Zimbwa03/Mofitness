import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native-paper";

import type { CoachImageKey } from "../../assets/coaches";
import { useCoachImage } from "../../assets/coaches";
import { useCoachStore } from "../../stores/coachStore";
import { colors, theme, typography } from "../../theme";

interface CoachFullPanelProps {
  message: string;
  pose?: CoachImageKey;
  feature?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function CoachFullPanel({
  message,
  pose = "standing",
  feature,
  actionLabel,
  onActionPress,
}: CoachFullPanelProps) {
  const coachName = useCoachStore((state) => state.coachName);
  const image = useCoachImage(pose);
  const [typed, setTyped] = useState("");
  const [showAction, setShowAction] = useState(false);
  const imageX = useRef(new Animated.Value(28)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const actionOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(imageX, { toValue: 0, tension: 65, friction: 8, useNativeDriver: true }),
      Animated.timing(imageOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [imageOpacity, imageX]);

  useEffect(() => {
    setTyped("");
    setShowAction(false);
    actionOpacity.setValue(0);

    let cursor = 0;
    const id = setInterval(() => {
      cursor += 1;
      setTyped(message.slice(0, cursor));
      if (cursor >= message.length) {
        clearInterval(id);
        setShowAction(true);
        Animated.timing(actionOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      }
    }, 30);
    return () => clearInterval(id);
  }, [actionOpacity, message]);

  const header = useMemo(() => {
    return feature ? `${coachName} · ${feature}` : coachName;
  }, [coachName, feature]);

  return (
    <View style={styles.card}>
      <LinearGradient colors={["#141414", "#1E1E1E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient} />
      <View style={styles.glow} />
      <View style={styles.leftAccent} />

      <View style={styles.content}>
        <Text style={styles.header}>{header}</Text>
        <View style={styles.headerRule} />
        <Text numberOfLines={5} style={styles.message}>
          {typed}
        </Text>
      </View>

      <Animated.Image
        source={image}
        style={[styles.coachImage, { opacity: imageOpacity, transform: [{ translateX: imageX }] }]}
        accessibilityRole="image"
        accessibilityLabel={`${coachName} coach ${pose} pose`}
      />

      {actionLabel && onActionPress && showAction ? (
        <Animated.View style={[styles.actionWrap, { opacity: actionOpacity }]}>
          <Pressable onPress={onActionPress} style={styles.actionBtn}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 200,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    position: "relative",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: "absolute",
    top: -30,
    right: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(200,241,53,0.08)",
  },
  leftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.accent_green,
  },
  content: {
    flex: 1,
    paddingLeft: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 52,
    paddingRight: 130,
    gap: theme.spacing.xs,
  },
  header: {
    ...typography.label,
    color: colors.accent_green,
  },
  headerRule: {
    width: 84,
    height: 1,
    backgroundColor: colors.border_strong,
    marginBottom: theme.spacing.xs,
  },
  message: {
    ...typography.body_md,
    color: colors.text_primary,
  },
  coachImage: {
    position: "absolute",
    right: -4,
    bottom: 0,
    height: 180,
    width: 118,
    resizeMode: "contain",
  },
  actionWrap: {
    position: "absolute",
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    bottom: theme.spacing.md,
  },
  actionBtn: {
    height: 36,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent_green,
  },
  actionText: {
    ...typography.body_sm,
    color: colors.text_inverse,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
});

