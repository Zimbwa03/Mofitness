import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CoachType = "male" | "female";
export type CoachName = "Mo" | "Nia";

interface CoachStore {
  selectedCoach: CoachType;
  coachName: CoachName;
  setCoach: (coach: CoachType) => void;
}

const coachNameByType: Record<CoachType, CoachName> = {
  male: "Mo",
  female: "Nia",
};

export const useCoachStore = create<CoachStore>()(
  persist(
    (set) => ({
      selectedCoach: "male",
      coachName: "Mo",
      setCoach: (coach) => {
        set({
          selectedCoach: coach,
          coachName: coachNameByType[coach],
        });
      },
    }),
    {
      name: "mofitness-coach",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

