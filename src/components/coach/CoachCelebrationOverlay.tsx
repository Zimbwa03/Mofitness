import { useEffect, useRef } from "react";
import { Animated, Image, Modal, StyleSheet, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { Text } from "react-native-paper";

import { useCoachImage } from "../../assets/coaches";
import { useCoachStore } from "../../stores/coachStore";
import { colors, layout, theme, typography } from "../../theme";
import { MoButton } from "../common/MoButton";

interface CoachCelebrationOverlayProps {
  visible: boolean;
  title: string;
  message: string;
  quote?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  onDismiss?: () => void;
}

export function CoachCelebrationOverlay({
  visible,
  title,
  message,
  quote,
  actionLabel = "Save & Continue",
  onActionPress,
  onDismiss,
}: CoachCelebrationOverlayProps) {
  const coachName = useCoachStore((state) => state.coachName);
  const image = useCoachImage("celebration");
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const coachY = useRef(new Animated.Value(120)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.95)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    overlayOpacity.setValue(0);
    coachY.setValue(120);
    textOpacity.setValue(0);
    textScale.setValue(0.95);
    buttonOpacity.setValue(0);

    Animated.timing(overlayOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.spring(coachY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }).start();
    }, 200);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(textScale, { toValue: 1, tension: 75, friction: 8, useNativeDriver: true }),
      ]).start();
    }, 600);
    setTimeout(() => {
      Animated.timing(buttonOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }, 1400);
  }, [buttonOpacity, coachY, overlayOpacity, textOpacity, textScale, visible]);

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        {visible ? (
          <ConfettiCannon count={90} origin={{ x: 20, y: 0 }} colors={[colors.accent_green, colors.accent_amber]} fadeOut />
        ) : null}
        <Animated.View style={[styles.textCard, { opacity: textOpacity, transform: [{ scale: textScale }] }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {quote ? <Text style={styles.quote}>{`${coachName}: "${quote}"`}</Text> : null}
        </Animated.View>

        <Animated.View style={[styles.coachWrap, { transform: [{ translateY: coachY }] }]}>
          <Image source={image} style={styles.coachImage} accessibilityRole="image" accessibilityLabel={`${coachName} coach celebration pose`} />
        </Animated.View>

        <Animated.View style={[styles.buttonWrap, { opacity: buttonOpacity }]}>
          <MoButton onPress={onActionPress}>{actionLabel}</MoButton>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "space-between",
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
  },
  textCard: {
    marginHorizontal: layout.screen_padding_h,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: "rgba(20,20,20,0.92)",
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  title: {
    ...typography.display_sm,
    color: colors.accent_green,
  },
  message: {
    ...typography.body_lg,
    color: colors.text_primary,
  },
  quote: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
  coachWrap: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  coachImage: {
    height: "65%",
    width: "90%",
    resizeMode: "contain",
  },
  buttonWrap: {
    paddingHorizontal: layout.screen_padding_h,
  },
});

