import { create } from "zustand";

import type { RecommendationItem } from "../models";

interface RecommendationState {
  recommendations: RecommendationItem[];
  setRecommendations: (recommendations: RecommendationItem[]) => void;
}

export const useRecommendationStore = create<RecommendationState>((set) => ({
  recommendations: [],
  setRecommendations: (recommendations) => set({ recommendations }),
}));
