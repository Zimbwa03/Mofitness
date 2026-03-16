import type { AvatarAnimation, AvatarKeyframe } from "../types";

interface CreateAnimationOptions {
  phase?: AvatarAnimation["phase"];
  repPhases?: AvatarAnimation["repPhases"];
  style?: AvatarAnimation["style"];
}

export function createAnimation(
  name: string,
  durationMs: number,
  keyframes: AvatarKeyframe[],
  coachingCues: string[],
  optionsOrPhase: CreateAnimationOptions | AvatarAnimation["phase"] = {},
): AvatarAnimation {
  const options =
    typeof optionsOrPhase === "string"
      ? ({ phase: optionsOrPhase } satisfies CreateAnimationOptions)
      : optionsOrPhase;
  const { phase = "concentric", repPhases, style } = options;

  return {
    name,
    durationMs,
    loop: true,
    keyframes,
    phase,
    coachingCues,
    repPhases,
    style,
  };
}

export const neutralFrame: AvatarKeyframe = {
  t: 0,
  torso: { rotate: 0, translateX: 0, translateY: 0 },
  thighL: { rotate: 0, translateX: 0, translateY: 0 },
  shinL: { rotate: 0, translateX: 0, translateY: 0 },
  thighR: { rotate: 0, translateX: 0, translateY: 0 },
  shinR: { rotate: 0, translateX: 0, translateY: 0 },
  upperArmL: { rotate: 8, translateX: 0, translateY: 0 },
  foreArmL: { rotate: 6, translateX: 0, translateY: 0 },
  upperArmR: { rotate: -8, translateX: 0, translateY: 0 },
  foreArmR: { rotate: -6, translateX: 0, translateY: 0 },
  head: { rotate: 0, translateX: 0, translateY: 0 },
  foot: { rotate: 0, translateX: 0, translateY: 0 },
};
