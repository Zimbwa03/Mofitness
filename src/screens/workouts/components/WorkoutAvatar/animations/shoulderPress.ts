import { createAnimation } from "./shared";

export const shoulderPressAnimation = createAnimation(
  "Shoulder Press",
  2000,
  [
    {
      t: 0,
      torso: { rotate: 0, translateX: 0, translateY: 0 },
      upperArmL: { rotate: 84, translateX: 4, translateY: 0 },
      foreArmL: { rotate: 58, translateX: 5, translateY: 8 },
      upperArmR: { rotate: -84, translateX: -4, translateY: 0 },
      foreArmR: { rotate: -58, translateX: -5, translateY: 8 },
    },
    {
      t: 0.32,
      torso: { rotate: -1, translateX: 0, translateY: -2 },
      upperArmL: { rotate: 124, translateX: 5, translateY: -6 },
      foreArmL: { rotate: 34, translateX: 4, translateY: -3 },
      upperArmR: { rotate: -124, translateX: -5, translateY: -6 },
      foreArmR: { rotate: -34, translateX: -4, translateY: -3 },
      head: { rotate: 0, translateX: 0, translateY: -1 },
    },
    {
      t: 0.58,
      torso: { rotate: -2, translateX: 0, translateY: -4 },
      upperArmL: { rotate: 162, translateX: 6, translateY: -12 },
      foreArmL: { rotate: 20, translateX: 4, translateY: -10 },
      upperArmR: { rotate: -162, translateX: -6, translateY: -12 },
      foreArmR: { rotate: -20, translateX: -4, translateY: -10 },
      head: { rotate: 0, translateX: 0, translateY: -2 },
    },
    {
      t: 0.68,
      torso: { rotate: -2, translateX: 0, translateY: -4 },
      upperArmL: { rotate: 162, translateX: 6, translateY: -12 },
      foreArmL: { rotate: 20, translateX: 4, translateY: -10 },
      upperArmR: { rotate: -162, translateX: -6, translateY: -12 },
      foreArmR: { rotate: -20, translateX: -4, translateY: -10 },
      head: { rotate: 0, translateX: 0, translateY: -2 },
    },
    {
      t: 0.88,
      torso: { rotate: -1, translateX: 0, translateY: -1 },
      upperArmL: { rotate: 102, translateX: 5, translateY: -2 },
      foreArmL: { rotate: 42, translateX: 4, translateY: 2 },
      upperArmR: { rotate: -102, translateX: -5, translateY: -2 },
      foreArmR: { rotate: -42, translateX: -4, translateY: 2 },
    },
    {
      t: 1,
      torso: { rotate: 0, translateX: 0, translateY: 0 },
      upperArmL: { rotate: 84, translateX: 4, translateY: 0 },
      foreArmL: { rotate: 58, translateX: 5, translateY: 8 },
      upperArmR: { rotate: -84, translateX: -4, translateY: 0 },
      foreArmR: { rotate: -58, translateX: -5, translateY: 8 },
    },
  ],
  ["Brace core", "Press straight up", "Finish with biceps by ears"],
  {
    phase: "concentric",
    repPhases: {
      concentric: { start: 0, end: 0.58, label: "Press overhead" },
      isometric: { start: 0.58, end: 0.68, label: "Lockout control" },
      eccentric: { start: 0.68, end: 1, label: "Lower to rack line" },
    },
    style: {
      interpolation: "smoothstep",
      transitionMs: 210,
      shadowPulse: 1.1,
    },
  },
);
