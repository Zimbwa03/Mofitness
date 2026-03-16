import { createAnimation } from "./shared";

export const plankAnimation = createAnimation(
  "Plank",
  3000,
  [
    {
      t: 0,
      torso: { rotate: 52, translateX: -2, translateY: 34 },
      upperArmL: { rotate: 80, translateX: 8, translateY: 30 },
      foreArmL: { rotate: 28, translateX: 9, translateY: 32 },
      upperArmR: { rotate: -80, translateX: -8, translateY: 30 },
      foreArmR: { rotate: -28, translateX: -9, translateY: 32 },
      thighL: { rotate: -14, translateX: -3, translateY: 12 },
      thighR: { rotate: -14, translateX: 3, translateY: 12 },
      shinL: { rotate: -8, translateX: -2, translateY: 8 },
      shinR: { rotate: -8, translateX: 2, translateY: 8 },
    },
    {
      t: 0.5,
      torso: { rotate: 52, translateX: -2, translateY: 31 },
      head: { rotate: 0, translateX: 0, translateY: -2 },
      upperArmL: { rotate: 80, translateX: 8, translateY: 28 },
      upperArmR: { rotate: -80, translateX: -8, translateY: 28 },
      thighL: { rotate: -14, translateX: -3, translateY: 10 },
      thighR: { rotate: -14, translateX: 3, translateY: 10 },
    },
    {
      t: 0.75,
      torso: { rotate: 52, translateX: -2, translateY: 32 },
      head: { rotate: 0, translateX: 0, translateY: -1 },
      upperArmL: { rotate: 80, translateX: 8, translateY: 29 },
      upperArmR: { rotate: -80, translateX: -8, translateY: 29 },
      thighL: { rotate: -14, translateX: -3, translateY: 11 },
      thighR: { rotate: -14, translateX: 3, translateY: 11 },
    },
    {
      t: 1,
      torso: { rotate: 52, translateX: -2, translateY: 34 },
      upperArmL: { rotate: 80, translateX: 8, translateY: 30 },
      foreArmL: { rotate: 28, translateX: 9, translateY: 32 },
      upperArmR: { rotate: -80, translateX: -8, translateY: 30 },
      foreArmR: { rotate: -28, translateX: -9, translateY: 32 },
      thighL: { rotate: -14, translateX: -3, translateY: 12 },
      thighR: { rotate: -14, translateX: 3, translateY: 12 },
      shinL: { rotate: -8, translateX: -2, translateY: 8 },
      shinR: { rotate: -8, translateX: 2, translateY: 8 },
    },
  ],
  ["Brace core", "Keep hips level", "Long spine, neutral neck"],
  {
    phase: "isometric",
    repPhases: {
      isometric: { start: 0, end: 1, label: "Steady hold and breathing" },
    },
    style: {
      interpolation: "sine",
      transitionMs: 220,
      shadowPulse: 0.9,
    },
  },
);
