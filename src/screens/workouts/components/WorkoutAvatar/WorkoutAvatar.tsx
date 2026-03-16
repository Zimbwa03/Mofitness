import { useEffect, useMemo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Constants from "expo-constants";
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";

import { colors } from "../../../../theme";
import { AVATAR_PATHS, SEGMENT_PIVOTS } from "./avatarPaths";
import { exerciseAnimations, fallbackAnimation } from "./animations";
import { DEFAULT_TRANSFORM, type AvatarAnimation, type AvatarSegmentName, type Transform } from "./types";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedView = Animated.createAnimatedComponent(View);
const canUseReanimatedClock =
  Constants.appOwnership !== "expo" &&
  typeof (globalThis as { _getAnimationTimestamp?: unknown })._getAnimationTimestamp === "function";

interface WorkoutAvatarProps {
  exercise: string;
  isActive: boolean;
  speed?: number;
  size?: number;
  isVisible?: boolean;
  style?: ViewStyle;
}

function lerp(start: number, end: number, amount: number) {
  "worklet";
  return start + (end - start) * amount;
}

function clamp01(value: number) {
  "worklet";
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number) {
  "worklet";
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function sineInOut(value: number) {
  "worklet";
  const t = clamp01(value);
  return 0.5 * (1 - Math.cos(Math.PI * t));
}

function applyInterpolationCurve(progress: number, animation: AvatarAnimation) {
  "worklet";
  const interpolation = animation.style?.interpolation ?? "smoothstep";

  if (interpolation === "linear") {
    return clamp01(progress);
  }
  if (interpolation === "sine") {
    return sineInOut(progress);
  }

  return smoothstep(progress);
}

function normalizeTransform(transform: Partial<Transform> | undefined): Transform {
  "worklet";
  return {
    rotate: transform?.rotate ?? DEFAULT_TRANSFORM.rotate,
    translateX: transform?.translateX ?? DEFAULT_TRANSFORM.translateX,
    translateY: transform?.translateY ?? DEFAULT_TRANSFORM.translateY,
  };
}

function interpolateSegment(
  progress: number,
  animation: AvatarAnimation,
  segment: AvatarSegmentName,
): Transform {
  "worklet";

  const keyframes = animation.keyframes;
  if (keyframes.length === 0) {
    return DEFAULT_TRANSFORM;
  }

  if (keyframes.length === 1) {
    return normalizeTransform(keyframes[0][segment]);
  }

  const wrappedProgress = clamp01(progress);
  let previous = keyframes[0];
  let next = keyframes[keyframes.length - 1];

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const current = keyframes[index];
    const following = keyframes[index + 1];

    if (wrappedProgress >= current.t && wrappedProgress <= following.t) {
      previous = current;
      next = following;
      break;
    }
  }

  const frameRange = Math.max(0.0001, next.t - previous.t);
  const linearProgress = clamp01((wrappedProgress - previous.t) / frameRange);
  const localProgress = applyInterpolationCurve(linearProgress, animation);

  const start = normalizeTransform(previous[segment]);
  const end = normalizeTransform(next[segment]);

  return {
    rotate: lerp(start.rotate, end.rotate, localProgress),
    translateX: lerp(start.translateX, end.translateX, localProgress),
    translateY: lerp(start.translateY, end.translateY, localProgress),
  };
}

function useSegmentAnimatedProps(
  progress: SharedValue<number>,
  animation: AvatarAnimation,
  segment: AvatarSegmentName,
) {
  const pivot = SEGMENT_PIVOTS[segment];

  return useAnimatedProps(() => {
    const transform = interpolateSegment(progress.value, animation, segment);

    return {
      transform: `translate(${transform.translateX} ${transform.translateY}) rotate(${transform.rotate} ${pivot.x} ${pivot.y})`,
    };
  });
}

export function WorkoutAvatar({
  exercise,
  isActive,
  speed = 1,
  size = 260,
  isVisible = true,
  style,
}: WorkoutAvatarProps) {
  const animation = useMemo(() => exerciseAnimations[exercise] ?? fallbackAnimation, [exercise]);
  if (!canUseReanimatedClock) {
    return (
      <View style={[styles.container, style]}>
        <Svg viewBox="0 0 100 220" width={size * 0.46} height={size}>
          <Path d={AVATAR_PATHS.ground} fill="none" stroke={colors.accent_amber} strokeWidth={2.5} strokeLinecap="round" />
          <Ellipse cx={50} cy={205} rx={22} ry={4} fill="rgba(200,241,53,0.12)" />
          <G>
            <Path d={AVATAR_PATHS.shinR} stroke={colors.accent_green} strokeWidth={7} strokeLinecap="round" fill="none" />
            <Path d={AVATAR_PATHS.thighR} stroke={colors.accent_green} strokeWidth={9} strokeLinecap="round" fill="none" />
            <Path d={AVATAR_PATHS.shinL} stroke={colors.accent_green} strokeWidth={7} strokeLinecap="round" fill="none" />
            <Path d={AVATAR_PATHS.thighL} stroke={colors.accent_green} strokeWidth={9} strokeLinecap="round" fill="none" />
            <Path d={AVATAR_PATHS.torso} stroke={colors.accent_green} strokeWidth={12} strokeLinecap="round" fill="none" />
            <Path d={AVATAR_PATHS.upperArmR} stroke={colors.accent_green} strokeWidth={8} strokeLinecap="round" fill="none" />
            <Path d={AVATAR_PATHS.foreArmR} stroke={colors.accent_green} strokeWidth={6} strokeLinecap="round" fill="none" />
            <Path d={AVATAR_PATHS.upperArmL} stroke={colors.accent_green} strokeWidth={8} strokeLinecap="round" fill="none" />
            <Path d={AVATAR_PATHS.foreArmL} stroke={colors.accent_green} strokeWidth={6} strokeLinecap="round" fill="none" />
            <Path d={AVATAR_PATHS.foot} stroke={colors.accent_green} strokeWidth={5} strokeLinecap="round" fill="none" />
            <Circle cx={50} cy={58} r={14} fill={colors.accent_green} />
          </G>
        </Svg>
      </View>
    );
  }

  const progress = useSharedValue(0);
  const reveal = useSharedValue(1);

  useEffect(() => {
    if (!isVisible) {
      cancelAnimation(progress);
      cancelAnimation(reveal);
      progress.value = 0;
      reveal.value = 0;
      return;
    }

    cancelAnimation(progress);
    cancelAnimation(reveal);
    progress.value = 0;
    reveal.value = 0;
    reveal.value = withTiming(1, {
      duration: animation.style?.transitionMs ?? 220,
      easing: Easing.out(Easing.cubic),
    });

    const duration = Math.max(400, Math.round((isActive ? animation.durationMs : 3200) / Math.max(speed, 0.35)));
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: isActive ? Easing.linear : Easing.inOut(Easing.sin),
      }),
      -1,
      !isActive,
    );

    return () => {
      cancelAnimation(progress);
      cancelAnimation(reveal);
    };

  }, [animation.durationMs, animation.style?.transitionMs, isActive, isVisible, speed]);

  const shinRProps = useSegmentAnimatedProps(progress, animation, "shinR");
  const thighRProps = useSegmentAnimatedProps(progress, animation, "thighR");
  const shinLProps = useSegmentAnimatedProps(progress, animation, "shinL");
  const thighLProps = useSegmentAnimatedProps(progress, animation, "thighL");
  const torsoProps = useSegmentAnimatedProps(progress, animation, "torso");
  const upperArmRProps = useSegmentAnimatedProps(progress, animation, "upperArmR");
  const foreArmRProps = useSegmentAnimatedProps(progress, animation, "foreArmR");
  const upperArmLProps = useSegmentAnimatedProps(progress, animation, "upperArmL");
  const foreArmLProps = useSegmentAnimatedProps(progress, animation, "foreArmL");
  const headProps = useSegmentAnimatedProps(progress, animation, "head");
  const footProps = useSegmentAnimatedProps(progress, animation, "foot");
  const shadowProps = useAnimatedProps(() => {
    const torso = interpolateSegment(progress.value, animation, "torso");
    const thighL = interpolateSegment(progress.value, animation, "thighL");
    const thighR = interpolateSegment(progress.value, animation, "thighR");

    const depth = Math.max(0, torso.translateY);
    const stanceWidth = Math.abs(thighL.translateX - thighR.translateX);
    const shadowPulse = animation.style?.shadowPulse ?? 1;

    return {
      rx: 20 + depth * 0.06 + stanceWidth * 0.9,
      ry: 3.2 + depth * 0.01,
      opacity: Math.max(0.08, Math.min(0.25, 0.11 + depth * 0.0025 * shadowPulse)),
    };
  });
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ scale: 0.985 + 0.015 * reveal.value }],
  }));

  return (
    <View style={[styles.container, style]}>
      <AnimatedView style={revealStyle}>
        <Svg viewBox="0 0 100 220" width={size * 0.46} height={size}>
          <Path
            d={AVATAR_PATHS.ground}
            fill="none"
            stroke={colors.accent_amber}
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          <AnimatedEllipse animatedProps={shadowProps} cx={50} cy={205} rx={22} ry={4} fill="rgba(200,241,53,0.12)" />

          <AnimatedG animatedProps={shinRProps}>
            <Path d={AVATAR_PATHS.shinR} stroke={colors.accent_green} strokeWidth={7} strokeLinecap="round" fill="none" />
          </AnimatedG>
          <AnimatedG animatedProps={thighRProps}>
            <Path d={AVATAR_PATHS.thighR} stroke={colors.accent_green} strokeWidth={9} strokeLinecap="round" fill="none" />
          </AnimatedG>
          <AnimatedG animatedProps={shinLProps}>
            <Path d={AVATAR_PATHS.shinL} stroke={colors.accent_green} strokeWidth={7} strokeLinecap="round" fill="none" />
          </AnimatedG>
          <AnimatedG animatedProps={thighLProps}>
            <Path d={AVATAR_PATHS.thighL} stroke={colors.accent_green} strokeWidth={9} strokeLinecap="round" fill="none" />
          </AnimatedG>
          <AnimatedG animatedProps={torsoProps}>
            <Path d={AVATAR_PATHS.torso} stroke={colors.accent_green} strokeWidth={12} strokeLinecap="round" fill="none" />
          </AnimatedG>
          <AnimatedG animatedProps={upperArmRProps}>
            <Path d={AVATAR_PATHS.upperArmR} stroke={colors.accent_green} strokeWidth={8} strokeLinecap="round" fill="none" />
          </AnimatedG>
          <AnimatedG animatedProps={foreArmRProps}>
            <Path d={AVATAR_PATHS.foreArmR} stroke={colors.accent_green} strokeWidth={6} strokeLinecap="round" fill="none" />
          </AnimatedG>
          <AnimatedG animatedProps={upperArmLProps}>
            <Path d={AVATAR_PATHS.upperArmL} stroke={colors.accent_green} strokeWidth={8} strokeLinecap="round" fill="none" />
          </AnimatedG>
          <AnimatedG animatedProps={foreArmLProps}>
            <Path d={AVATAR_PATHS.foreArmL} stroke={colors.accent_green} strokeWidth={6} strokeLinecap="round" fill="none" />
          </AnimatedG>
          <AnimatedG animatedProps={footProps}>
            <Path d={AVATAR_PATHS.foot} stroke={colors.accent_green} strokeWidth={5} strokeLinecap="round" fill="none" />
          </AnimatedG>
          <AnimatedG animatedProps={headProps}>
            <Circle cx={50} cy={58} r={14} fill={colors.accent_green} />
          </AnimatedG>
        </Svg>
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
