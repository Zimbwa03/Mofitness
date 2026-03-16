import { useRecommendationStore } from "../stores/recommendationStore";

export const useRecommendations = () => ({
  recommendations: useRecommendationStore((state) => state.recommendations),
  setRecommendations: useRecommendationStore((state) => state.setRecommendations),
});
