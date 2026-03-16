import { createAnimation } from "./shared";

export const lateralRaiseAnimation = createAnimation(
  "Lateral Raise",
  1700,
  [
    {
      t: 0,
      upperArmL: { rotate: 10, translateX: 0, translateY: 0 },
      foreArmL: { rotate: 4, translateX: 0, translateY: 0 },
      upperArmR: { rotate: -10, translateX: 0, translateY: 0 },
      foreArmR: { rotate: -4, translateX: 0, translateY: 0 },
      torso: { rotate: 0, translateX: 0, translateY: 0 },
    },
    {
      t: 0.5,
      upperArmL: { rotate: 108, translateX: 6, translateY: -2 },
      foreArmL: { rotate: 18, translateX: 4, translateY: -4 },
      upperArmR: { rotate: -108, translateX: -6, translateY: -2 },
      foreArmR: { rotate: -18, translateX: -4, translateY: -4 },
      torso: { rotate: 0, translateX: 0, translateY: -2 },
    },
    {
      t: 1,
      upperArmL: { rotate: 10, translateX: 0, translateY: 0 },
      foreArmL: { rotate: 4, translateX: 0, translateY: 0 },
      upperArmR: { rotate: -10, translateX: 0, translateY: 0 },
      foreArmR: { rotate: -4, translateX: 0, translateY: 0 },
      torso: { rotate: 0, translateX: 0, translateY: 0 },
    },
  ],
  ["Lift to shoulder level", "Soft elbows", "No swinging"],
  "concentric",
);
