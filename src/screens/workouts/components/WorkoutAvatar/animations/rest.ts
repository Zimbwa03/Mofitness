import { createAnimation } from "./shared";

export const restAnimation = createAnimation(
  "Recovery Idle",
  3200,
  [
    {
      t: 0,
      torso: { rotate: 0, translateX: -1, translateY: 0 },
      head: { rotate: 0, translateX: -1, translateY: 0 },
      upperArmL: { rotate: 12, translateX: 0, translateY: 0 },
      upperArmR: { rotate: -12, translateX: 0, translateY: 0 },
      thighL: { rotate: 2, translateX: -1, translateY: 0 },
      thighR: { rotate: -2, translateX: 1, translateY: 0 },
    },
    {
      t: 0.5,
      torso: { rotate: 1, translateX: 1, translateY: -2 },
      head: { rotate: 0, translateX: 1, translateY: -2 },
      upperArmL: { rotate: 8, translateX: 0, translateY: -1 },
      upperArmR: { rotate: -8, translateX: 0, translateY: -1 },
      thighL: { rotate: -2, translateX: -1, translateY: 1 },
      thighR: { rotate: 2, translateX: 1, translateY: 1 },
    },
    {
      t: 1,
      torso: { rotate: 0, translateX: -1, translateY: 0 },
      head: { rotate: 0, translateX: -1, translateY: 0 },
      upperArmL: { rotate: 12, translateX: 0, translateY: 0 },
      upperArmR: { rotate: -12, translateX: 0, translateY: 0 },
      thighL: { rotate: 2, translateX: -1, translateY: 0 },
      thighR: { rotate: -2, translateX: 1, translateY: 0 },
    },
  ],
  ["Breathe in through the nose", "Shake out tension before next effort"],
  {
    phase: "rest",
    repPhases: {
      rest: { start: 0, end: 1, label: "Recovery breathing" },
    },
    style: {
      interpolation: "sine",
      transitionMs: 260,
      shadowPulse: 0.8,
    },
  },
);
