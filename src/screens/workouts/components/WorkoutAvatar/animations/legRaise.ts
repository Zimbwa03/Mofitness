import { createAnimation } from "./shared";

export const legRaiseAnimation = createAnimation(
  "Leg Raise",
  1900,
  [
    {
      t: 0,
      torso: { rotate: 70, translateX: -2, translateY: 52 },
      thighL: { rotate: -8, translateX: -2, translateY: 6 },
      thighR: { rotate: -8, translateX: 2, translateY: 6 },
      shinL: { rotate: 2, translateX: -1, translateY: 4 },
      shinR: { rotate: 2, translateX: 1, translateY: 4 },
    },
    {
      t: 0.5,
      torso: { rotate: 70, translateX: -2, translateY: 50 },
      thighL: { rotate: 72, translateX: -4, translateY: -12 },
      thighR: { rotate: 72, translateX: 4, translateY: -12 },
      shinL: { rotate: 16, translateX: -2, translateY: -10 },
      shinR: { rotate: 16, translateX: 2, translateY: -10 },
      head: { rotate: 0, translateX: 0, translateY: -2 },
    },
    {
      t: 1,
      torso: { rotate: 70, translateX: -2, translateY: 52 },
      thighL: { rotate: -8, translateX: -2, translateY: 6 },
      thighR: { rotate: -8, translateX: 2, translateY: 6 },
      shinL: { rotate: 2, translateX: -1, translateY: 4 },
      shinR: { rotate: 2, translateX: 1, translateY: 4 },
    },
  ],
  ["Flatten low back", "Lift with lower abs", "Lower under control"],
  "concentric",
);
