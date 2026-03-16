import { useWellnessStore } from "../stores/wellnessStore";

export const useWellness = () => ({
  snapshot: useWellnessStore((state) => state.snapshot),
  setSnapshot: useWellnessStore((state) => state.setSnapshot),
});
