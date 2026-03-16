import type { ImageSourcePropType } from "react-native";

import { useCoachStore, type CoachType } from "../../stores/coachStore";

export const CoachImages = {
  male: {
    standing: require("../../../assets/Coaches/coach_male_standing.png.jpeg"),
    chat: require("../../../assets/Coaches/coach_male_chat.png.jpeg"),
    squat: require("../../../assets/Coaches/coach_male_squat.png.jpeg"),
    phone: require("../../../assets/Coaches/coach_male_phone.png.jpeg"),
    celebration: require("../../../assets/Coaches/coach_male_celebration.png.jpeg"),
    warning: require("../../../assets/Coaches/coach_male_warning.png.jpeg"),
    sprint: require("../../../assets/Coaches/coach_male_sprint.png.jpeg"),
    nutrition: require("../../../assets/Coaches/coach_male_nutrition.png.jpeg"),
    thinking: require("../../../assets/Coaches/coach_male_thinking.png.jpeg"),
    standing_alt: require("../../../assets/Coaches/coach_male_standing.png.jpeg"),
  },
  female: {
    standing: require("../../../assets/Coaches/coach_female_standing.png.jpeg"),
    chat: require("../../../assets/Coaches/coach_female_chat.png.jpeg"),
    squat: require("../../../assets/Coaches/coach_female_squat.png.jpeg"),
    phone: require("../../../assets/Coaches/coach_female_phone.png.jpeg"),
    celebration: require("../../../assets/Coaches/coach_female_celebration.png.jpeg"),
    warning: require("../../../assets/Coaches/coach_female_warning.png.jpeg"),
    sprint: require("../../../assets/Coaches/coach_female_sprint.png.jpeg"),
    nutrition: require("../../../assets/Coaches/coach_female_nutrition.png.jpeg"),
    thinking: require("../../../assets/Coaches/coach_female_thinking.png.jpeg"),
    standing_alt: require("../../../assets/Coaches/coach_female_standing.png.jpeg"),
  },
} as const;

export type CoachImageKey = keyof (typeof CoachImages)["male"];

export const getCoachImage = (coach: CoachType, pose: CoachImageKey): ImageSourcePropType => {
  return CoachImages[coach][pose];
};

export const getAllCoachImages = (): number[] => {
  return [...Object.values(CoachImages.male), ...Object.values(CoachImages.female)] as number[];
};

export const useCoachImage = (pose: CoachImageKey): ImageSourcePropType => {
  const selectedCoach = useCoachStore((state) => state.selectedCoach);
  return CoachImages[selectedCoach][pose];
};

