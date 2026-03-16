import { createAnimation } from "./shared";

export const calfRaiseAnimation = createAnimation(
  "Calf Raise",
  1300,
  [
    {
      t: 0,
      torso: { rotate: 0, translateX: 0, translateY: 0 },
      shinL: { rotate: 2, translateX: -1, translateY: 0 },
      shinR: { rotate: 2, translateX: 1, translateY: 0 },
      foot: { rotate: 0, translateX: 0, translateY: 0 },
    },
    {
      t: 0.45,
      torso: { rotate: 0, translateX: 0, translateY: -8 },
      shinL: { rotate: -4, translateX: -1, translateY: -4 },
      shinR: { rotate: -4, translateX: 1, translateY: -4 },
      foot: { rotate: -10, translateX: 0, translateY: -3 },
      head: { rotate: 0, translateX: 0, translateY: -4 },
    },
    {
      t: 1,
      torso: { rotate: 0, translateX: 0, translateY: 0 },
      shinL: { rotate: 2, translateX: -1, translateY: 0 },
      shinR: { rotate: 2, translateX: 1, translateY: 0 },
      foot: { rotate: 0, translateX: 0, translateY: 0 },
    },
  ],
  ["Rise onto toes", "Pause at top", "Lower slowly"],
  "concentric",
);
