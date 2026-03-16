import { createAnimation } from "./shared";

export const russianTwistAnimation = createAnimation(
  "Russian Twist",
  1400,
  [
    {
      t: 0,
      torso: { rotate: -22, translateX: -3, translateY: 22 },
      upperArmL: { rotate: 42, translateX: 3, translateY: 12 },
      upperArmR: { rotate: -22, translateX: 1, translateY: 12 },
      thighL: { rotate: -38, translateX: -2, translateY: 18 },
      thighR: { rotate: -38, translateX: 2, translateY: 18 },
      shinL: { rotate: 64, translateX: -2, translateY: 20 },
      shinR: { rotate: 64, translateX: 2, translateY: 20 },
    },
    {
      t: 0.5,
      torso: { rotate: 22, translateX: 3, translateY: 22 },
      upperArmL: { rotate: 22, translateX: -1, translateY: 12 },
      upperArmR: { rotate: -42, translateX: -3, translateY: 12 },
      thighL: { rotate: -38, translateX: -2, translateY: 18 },
      thighR: { rotate: -38, translateX: 2, translateY: 18 },
      shinL: { rotate: 64, translateX: -2, translateY: 20 },
      shinR: { rotate: 64, translateX: 2, translateY: 20 },
    },
    {
      t: 1,
      torso: { rotate: -22, translateX: -3, translateY: 22 },
      upperArmL: { rotate: 42, translateX: 3, translateY: 12 },
      upperArmR: { rotate: -22, translateX: 1, translateY: 12 },
      thighL: { rotate: -38, translateX: -2, translateY: 18 },
      thighR: { rotate: -38, translateX: 2, translateY: 18 },
      shinL: { rotate: 64, translateX: -2, translateY: 20 },
      shinR: { rotate: 64, translateX: 2, translateY: 20 },
    },
  ],
  ["Rotate from ribs", "Keep chest lifted", "Control both directions"],
  "concentric",
);
