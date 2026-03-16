import { createAnimation } from "./shared";

export const bicepCurlAnimation = createAnimation(
  "Bicep Curl",
  1700,
  [
    {
      t: 0,
      upperArmL: { rotate: 6, translateX: 0, translateY: 0 },
      upperArmR: { rotate: -6, translateX: 0, translateY: 0 },
      foreArmL: { rotate: 2, translateX: 0, translateY: 0 },
      foreArmR: { rotate: -2, translateX: 0, translateY: 0 },
      torso: { rotate: 0, translateX: 0, translateY: 0 },
    },
    {
      t: 0.5,
      upperArmL: { rotate: 8, translateX: 0, translateY: 0 },
      upperArmR: { rotate: -8, translateX: 0, translateY: 0 },
      foreArmL: { rotate: 82, translateX: 3, translateY: -6 },
      foreArmR: { rotate: -82, translateX: -3, translateY: -6 },
      torso: { rotate: 0, translateX: 0, translateY: -1 },
    },
    {
      t: 1,
      upperArmL: { rotate: 6, translateX: 0, translateY: 0 },
      upperArmR: { rotate: -6, translateX: 0, translateY: 0 },
      foreArmL: { rotate: 2, translateX: 0, translateY: 0 },
      foreArmR: { rotate: -2, translateX: 0, translateY: 0 },
      torso: { rotate: 0, translateX: 0, translateY: 0 },
    },
  ],
  ["Keep elbows pinned", "Squeeze at top", "Lower slowly"],
  "concentric",
);
