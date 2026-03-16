import { createAnimation } from "./shared";

export const tricepDipAnimation = createAnimation(
  "Tricep Dip",
  1800,
  [
    {
      t: 0,
      torso: { rotate: 22, translateX: 0, translateY: 12 },
      upperArmL: { rotate: 46, translateX: 5, translateY: 12 },
      foreArmL: { rotate: 12, translateX: 4, translateY: 15 },
      upperArmR: { rotate: -46, translateX: -5, translateY: 12 },
      foreArmR: { rotate: -12, translateX: -4, translateY: 15 },
      thighL: { rotate: -12, translateX: -1, translateY: 8 },
      thighR: { rotate: -12, translateX: 1, translateY: 8 },
    },
    {
      t: 0.5,
      torso: { rotate: 28, translateX: 0, translateY: 24 },
      upperArmL: { rotate: 66, translateX: 6, translateY: 20 },
      foreArmL: { rotate: 42, translateX: 6, translateY: 22 },
      upperArmR: { rotate: -66, translateX: -6, translateY: 20 },
      foreArmR: { rotate: -42, translateX: -6, translateY: 22 },
      thighL: { rotate: -18, translateX: -1, translateY: 10 },
      thighR: { rotate: -18, translateX: 1, translateY: 10 },
    },
    {
      t: 1,
      torso: { rotate: 22, translateX: 0, translateY: 12 },
      upperArmL: { rotate: 46, translateX: 5, translateY: 12 },
      foreArmL: { rotate: 12, translateX: 4, translateY: 15 },
      upperArmR: { rotate: -46, translateX: -5, translateY: 12 },
      foreArmR: { rotate: -12, translateX: -4, translateY: 15 },
      thighL: { rotate: -12, translateX: -1, translateY: 8 },
      thighR: { rotate: -12, translateX: 1, translateY: 8 },
    },
  ],
  ["Shoulders down", "Elbows back", "Press through palms"],
  "concentric",
);
