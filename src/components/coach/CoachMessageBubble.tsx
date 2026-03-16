import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import type { CoachImageKey } from "../../assets/coaches";
import { useCoachImage } from "../../assets/coaches";
import { useCoachStore } from "../../stores/coachStore";
import { colors, theme, typography } from "../../theme";

interface CoachMessageBubbleProps {
  message: string;
  pose?: CoachImageKey;
  feature?: string;
  isLoading?: boolean;
  onPress?: () => void;
}

const READ_MORE_THRESHOLD = 120;

export function CoachMessageBubble({
  message,
  pose = "chat",
  feature,
  isLoading = false,
  onPress,
}: CoachMessageBubbleProps) {
  const coachName = useCoachStore((state) => state.coachName);
  const image = useCoachImage(isLoading ? "thinking" : pose);
  const [expanded, setExpanded] = useState(false);
  const [dotCount, setDotCount] = useState(1);
  const slideIn = useRef(new Animated.Value(20)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.95)).current;

  const shouldTruncate = useMemo(() => message.length > READ_MORE_THRESHOLD, [message]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideIn, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(avatarScale, { toValue: 1, tension: 90, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [avatarScale, fadeIn, slideIn]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }
    const id = setInterval(() => {
      setDotCount((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 420);
    return () => clearInterval(id);
  }, [isLoading]);

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeIn, transform: [{ translateY: slideIn }] }]}>
      <Pressable onPress={onPress} style={styles.container}>
        <View style={styles.leftAccent} />
        <Animated.View style={[styles.avatarWrap, { transform: [{ scale: avatarScale }] }]}>
          <Image
            source={image}
            style={styles.avatar}
            accessibilityRole="image"
            accessibilityLabel={`${coachName} coach ${isLoading ? "thinking" : pose} pose`}
          />
        </Animated.View>
        <View style={styles.content}>
          <Text numberOfLines={expanded ? undefined : 3} style={styles.message}>
            {isLoading ? `${coachName} is thinking${".".repeat(dotCount)}` : message}
          </Text>
          {!isLoading && shouldTruncate && !expanded ? (
            <Text onPress={() => setExpanded(true)} style={styles.readMore}>
              Read more
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.coachName}>{coachName}</Text>
            {feature ? (
              <View style={styles.featurePill}>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  container: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_surface,
    padding: theme.spacing.md,
    paddingLeft: theme.spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    overflow: "hidden",
  },
  leftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.accent_green,
  },
  avatarWrap: {
    marginLeft: theme.spacing.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.accent_green,
  },
  content: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  message: {
    ...typography.body_md,
    color: colors.text_primary,
  },
  readMore: {
    ...typography.body_sm,
    color: colors.accent_green,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  coachName: {
    ...typography.label,
    color: colors.accent_green,
  },
  featurePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(245,166,35,0.18)",
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.45)",
  },
  featureText: {
    ...typography.caption,
    color: colors.accent_amber,
    textTransform: "uppercase",
  },
});

