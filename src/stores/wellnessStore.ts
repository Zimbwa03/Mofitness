import { create } from "zustand";

import type { WellnessSnapshot } from "../models";

interface WellnessState {
  snapshot: WellnessSnapshot | null;
  setSnapshot: (snapshot: WellnessSnapshot) => void;
}

export const useWellnessStore = create<WellnessState>((set) => ({
  snapshot: null,
  setSnapshot: (snapshot) => set({ snapshot }),
}));
