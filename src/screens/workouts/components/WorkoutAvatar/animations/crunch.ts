import { createAnimation } from "./shared";

export const crunchAnimation = createAnimation(
  "Crunch",
  1500,
  [
    {
      t: 0,
      torso: { rotate: 72, translateX: -2, translateY: 56 },
      thighL: { rotate: -34, translateX: -2, translateY: 16 },
      thighR: { rotate: -34, translateX: 2, translateY: 16 },
      shinL: { rotate: 62, translateX: -2, translateY: 18 },
      shinR: { rotate: 62, translateX: 2, translateY: 18 },
      upperArmL: { rotate: 22, translateX: 2, translateY: 18 },
      upperArmR: { rotate: -22, translateX: -2, translateY: 18 },
    },
    {
      t: 0.5,
      torso: { rotate: 48, translateX: -2, translateY: 40 },
      head: { rotate: 0, translateX: 0, translateY: -8 },
      upperArmL: { rotate: 34, translateX: 3, translateY: 10 },
      upperArmR: { rotate: -34, translateX: -3, translateY: 10 },
      thighL: { rotate: -34, translateX: -2, translateY: 16 },
      thighR: { rotate: -34, translateX: 2, translateY: 16 },
      shinL: { rotate: 62, translateX: -2, translateY: 18 },
      shinR: { rotate: 62, translateX: 2, translateY: 18 },
    },
    {
      t: 1,
      torso: { rotate: 72, translateX: -2, translateY: 56 },
      thighL: { rotate: -34, translateX: -2, translateY: 16 },
      thighR: { rotate: -34, translateX: 2, translateY: 16 },
      shinL: { rotate: 62, translateX: -2, translateY: 18 },
      shinR: { rotate: 62, translateX: 2, translateY: 18 },
      upperArmL: { rotate: 22, translateX: 2, translateY: 18 },
      upperArmR: { rotate: -22, translateX: -2, translateY: 18 },
    },
  ],
  ["Ribs to pelvis", "Avoid neck pulling", "Exhale at top"],
  "concentric",
);
