export type AvatarSegmentName =
  | "head"
  | "torso"
  | "upperArmL"
  | "foreArmL"
  | "upperArmR"
  | "foreArmR"
  | "thighL"
  | "shinL"
  | "thighR"
  | "shinR"
  | "foot";

export interface Transform {
  rotate: number;
  translateX: number;
  translateY: number;
}

export type SegmentTransforms = Partial<Record<AvatarSegmentName, Partial<Transform>>>;

export interface AvatarKeyframe extends SegmentTransforms {
  t: number;
}

export interface RepPhaseWindow {
  start: number;
  end: number;
  label?: string;
}

export interface AvatarRepPhases {
  eccentric?: RepPhaseWindow;
  concentric?: RepPhaseWindow;
  isometric?: RepPhaseWindow;
  rest?: RepPhaseWindow;
}

export interface AvatarAnimationStyle {
  interpolation?: "linear" | "smoothstep" | "sine";
  transitionMs?: number;
  shadowPulse?: number;
}

export interface AvatarAnimation {
  name: string;
  durationMs: number;
  loop: boolean;
  keyframes: AvatarKeyframe[];
  phase?: "concentric" | "eccentric" | "isometric" | "rest";
  coachingCues?: string[];
  repPhases?: AvatarRepPhases;
  style?: AvatarAnimationStyle;
}

export const DEFAULT_TRANSFORM: Transform = {
  rotate: 0,
  translateX: 0,
  translateY: 0,
};
