import type { AvatarAnimation } from "../types";
import { benchPressAnimation } from "./benchPress";
import { bicepCurlAnimation } from "./bicepCurl";
import { burpeeAnimation } from "./burpee";
import { calfRaiseAnimation } from "./calfRaise";
import { crunchAnimation } from "./crunch";
import { deadliftAnimation } from "./deadlift";
import { highKneesAnimation } from "./highKnees";
import { hipFlexorStretchAnimation } from "./hipFlexorStretch";
import { hipThrustAnimation } from "./hipThrust";
import { jumpingJackAnimation } from "./jumpingJack";
import { lateralRaiseAnimation } from "./lateralRaise";
import { legRaiseAnimation } from "./legRaise";
import { lungeAnimation } from "./lunge";
import { mountainClimberAnimation } from "./mountainClimber";
import { plankAnimation } from "./plank";
import { pullupAnimation } from "./pullUp";
import { pushupAnimation } from "./pushup";
import { restAnimation } from "./rest";
import { russianTwistAnimation } from "./russianTwist";
import { shoulderPressAnimation } from "./shoulderPress";
import { squatAnimation } from "./squat";
import { tricepDipAnimation } from "./tricepDip";

export const exerciseAnimations: Record<string, AvatarAnimation> = {
  squat: squatAnimation,
  deadlift: deadliftAnimation,
  pushup: pushupAnimation,
  pullup: pullupAnimation,
  lunge: lungeAnimation,
  plank: plankAnimation,
  burpee: burpeeAnimation,
  jumpingJack: jumpingJackAnimation,
  shoulderPress: shoulderPressAnimation,
  bicepCurl: bicepCurlAnimation,
  tricepDip: tricepDipAnimation,
  mountainClimber: mountainClimberAnimation,
  highKnees: highKneesAnimation,
  benchPress: benchPressAnimation,
  hipThrust: hipThrustAnimation,
  hipFlexorStretch: hipFlexorStretchAnimation,
  calfRaise: calfRaiseAnimation,
  lateralRaise: lateralRaiseAnimation,
  russianTwist: russianTwistAnimation,
  legRaise: legRaiseAnimation,
  crunch: crunchAnimation,
  rest: restAnimation,
};

export const fallbackAnimation = restAnimation;
