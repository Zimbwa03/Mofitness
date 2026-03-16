import { useWorkoutStore } from "../stores/workoutStore";

export const useWorkouts = () => {
  const workouts = useWorkoutStore((state) => state.workouts);
  const setWorkouts = useWorkoutStore((state) => state.setWorkouts);

  const allWorkouts = useWorkoutStore((state) => state.allWorkouts);
  const filteredWorkouts = useWorkoutStore((state) => state.filteredWorkouts);
  const activeFilters = useWorkoutStore((state) => state.activeFilters);
  const searchQuery = useWorkoutStore((state) => state.searchQuery);
  const aiRecommendations = useWorkoutStore((state) => state.aiRecommendations);
  const isAILoading = useWorkoutStore((state) => state.isAILoading);
  const weeklyPlan = useWorkoutStore((state) => state.weeklyPlan);

  const activeSession = useWorkoutStore((state) => state.activeSession);
  const currentExerciseIdx = useWorkoutStore((state) => state.currentExerciseIdx);
  const currentSetIdx = useWorkoutStore((state) => state.currentSetIdx);
  const sessionTimer = useWorkoutStore((state) => state.sessionTimer);
  const restTimer = useWorkoutStore((state) => state.restTimer);
  const isResting = useWorkoutStore((state) => state.isResting);
  const isPaused = useWorkoutStore((state) => state.isPaused);
  const completedSets = useWorkoutStore((state) => state.completedSets);

  const initializeCatalog = useWorkoutStore((state) => state.initializeCatalog);
  const setFilters = useWorkoutStore((state) => state.setFilters);
  const patchFilters = useWorkoutStore((state) => state.patchFilters);
  const setSearchQuery = useWorkoutStore((state) => state.setSearchQuery);
  const setAIRecommendations = useWorkoutStore((state) => state.setAIRecommendations);
  const setAILoading = useWorkoutStore((state) => state.setAILoading);

  const startSession = useWorkoutStore((state) => state.startSession);
  const completeSet = useWorkoutStore((state) => state.completeSet);
  const startRest = useWorkoutStore((state) => state.startRest);
  const skipRest = useWorkoutStore((state) => state.skipRest);
  const pauseSession = useWorkoutStore((state) => state.pauseSession);
  const resumeSession = useWorkoutStore((state) => state.resumeSession);
  const tickSession = useWorkoutStore((state) => state.tickSession);
  const endSession = useWorkoutStore((state) => state.endSession);
  const nextExercise = useWorkoutStore((state) => state.nextExercise);
  const prevExercise = useWorkoutStore((state) => state.prevExercise);

  return {
    workouts,
    setWorkouts,

    allWorkouts,
    filteredWorkouts,
    activeFilters,
    searchQuery,
    aiRecommendations,
    isAILoading,
    weeklyPlan,

    activeSession,
    currentExerciseIdx,
    currentSetIdx,
    sessionTimer,
    restTimer,
    isResting,
    isPaused,
    completedSets,

    initializeCatalog,
    setFilters,
    patchFilters,
    setSearchQuery,
    setAIRecommendations,
    setAILoading,

    startSession,
    completeSet,
    startRest,
    skipRest,
    pauseSession,
    resumeSession,
    tickSession,
    endSession,
    nextExercise,
    prevExercise,
  };
};
