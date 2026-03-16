import { create } from "zustand";

import type { WorkoutPlanItem } from "../models";
import {
  DEFAULT_WORKOUT_FILTERS,
  type CompletedSet,
  type SetData,
  type Track,
  type WeeklyWorkoutSlot,
  type WorkoutFilters,
  type WorkoutSession,
  type WorkoutSummary,
  type WorkoutTemplate,
} from "../models/workout";
import workoutService from "../services/WorkoutService";

interface WorkoutStore {
  workouts: WorkoutPlanItem[];
  setWorkouts: (workouts: WorkoutPlanItem[]) => void;

  allWorkouts: WorkoutTemplate[];
  filteredWorkouts: WorkoutTemplate[];
  activeFilters: WorkoutFilters;
  searchQuery: string;
  aiRecommendations: WorkoutTemplate[];
  isAILoading: boolean;
  weeklyPlan: WeeklyWorkoutSlot[];

  activeSession: WorkoutSession | null;
  currentExerciseIdx: number;
  currentSetIdx: number;
  sessionTimer: number;
  restTimer: number | null;
  isResting: boolean;
  isPaused: boolean;
  completedSets: CompletedSet[];
  sessionStartTime: Date | null;

  currentTrack: Track | null;
  isPlaying: boolean;
  playlist: Track[];

  initializeCatalog: () => void;
  setFilters: (filters: WorkoutFilters) => void;
  patchFilters: (patch: Partial<WorkoutFilters>) => void;
  setSearchQuery: (query: string) => void;
  setAIRecommendations: (workouts: WorkoutTemplate[]) => void;
  setAILoading: (isLoading: boolean) => void;

  startSession: (workout: WorkoutTemplate) => void;
  completeSet: (data: SetData) => void;
  startRest: (seconds: number) => void;
  skipRest: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  tickSession: () => void;
  endSession: () => WorkoutSummary | null;
  nextExercise: () => void;
  prevExercise: () => void;

  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaylist: (tracks: Track[]) => void;
}

function queryMatchesWorkout(workout: WorkoutTemplate, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const content = [
    workout.name,
    workout.description,
    workout.category,
    workout.difficulty,
    workout.anatomySummary,
    workout.intensitySummary,
    workout.motivationQuote,
    ...workout.benefits,
    ...workout.goalTags,
    ...workout.goalTags.map((tag) => tag.replace(/_/g, " ")),
    ...workout.muscleGroups,
    ...workout.equipment,
    ...workout.exercises.flatMap((exercise) => [exercise.exerciseName, exercise.cue ?? "", exercise.stimulusNote ?? ""]),
  ]
    .join(" ")
    .toLowerCase();

  return content.includes(normalized);
}

function deriveFilteredWorkouts(allWorkouts: WorkoutTemplate[], filters: WorkoutFilters, query: string) {
  const filtered = workoutService.applyFilters(allWorkouts, filters);
  return filtered.filter((workout) => queryMatchesWorkout(workout, query));
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  workouts: [],
  setWorkouts: (workouts) => set({ workouts }),

  allWorkouts: [],
  filteredWorkouts: [],
  activeFilters: DEFAULT_WORKOUT_FILTERS,
  searchQuery: "",
  aiRecommendations: [],
  isAILoading: false,
  weeklyPlan: [],

  activeSession: null,
  currentExerciseIdx: 0,
  currentSetIdx: 0,
  sessionTimer: 0,
  restTimer: null,
  isResting: false,
  isPaused: false,
  completedSets: [],
  sessionStartTime: null,

  currentTrack: null,
  isPlaying: false,
  playlist: [],

  initializeCatalog: () => {
    const allWorkouts = workoutService.getAllWorkouts();
    const activeFilters = get().activeFilters;
    const searchQuery = get().searchQuery;

    set({
      allWorkouts,
      filteredWorkouts: deriveFilteredWorkouts(allWorkouts, activeFilters, searchQuery),
      weeklyPlan: workoutService.getWeeklyPlanSlots(allWorkouts),
    });
  },

  setFilters: (filters) => {
    const allWorkouts = get().allWorkouts;
    const searchQuery = get().searchQuery;

    set({
      activeFilters: filters,
      filteredWorkouts: deriveFilteredWorkouts(allWorkouts, filters, searchQuery),
    });
  },

  patchFilters: (patch) => {
    const nextFilters = {
      ...get().activeFilters,
      ...patch,
    };

    const allWorkouts = get().allWorkouts;
    const searchQuery = get().searchQuery;

    set({
      activeFilters: nextFilters,
      filteredWorkouts: deriveFilteredWorkouts(allWorkouts, nextFilters, searchQuery),
    });
  },

  setSearchQuery: (query) => {
    const allWorkouts = get().allWorkouts;
    const filters = get().activeFilters;

    set({
      searchQuery: query,
      filteredWorkouts: deriveFilteredWorkouts(allWorkouts, filters, query),
    });
  },

  setAIRecommendations: (workouts) => set({ aiRecommendations: workouts }),
  setAILoading: (isAILoading) => set({ isAILoading }),

  startSession: (workout) => {
    const session: WorkoutSession = {
      sessionId: `${workout.id}:${Date.now()}`,
      workout,
      startedAt: new Date().toISOString(),
      isCompleted: false,
    };

    set({
      activeSession: session,
      currentExerciseIdx: 0,
      currentSetIdx: 0,
      sessionTimer: 0,
      restTimer: null,
      isResting: false,
      isPaused: false,
      completedSets: [],
      sessionStartTime: new Date(),
    });
  },

  completeSet: (data) => {
    const session = get().activeSession;
    if (!session) {
      return;
    }

    const exercise = session.workout.exercises[get().currentExerciseIdx];
    if (!exercise) {
      return;
    }

    const currentSetIdx = get().currentSetIdx;
    const nextCompletedSet: CompletedSet = {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.exerciseName,
      exerciseIndex: get().currentExerciseIdx,
      setIndex: currentSetIdx,
      repsCompleted: data.repsCompleted,
      weightKg: data.weightKg,
      restSeconds: data.restSeconds,
      loggedAt: new Date().toISOString(),
      perceivedDifficulty: data.perceivedDifficulty,
      notes: data.notes,
    };

    const completedSets = [...get().completedSets, nextCompletedSet];
    const isLastSetInExercise = currentSetIdx >= exercise.sets - 1;
    const isLastExercise = get().currentExerciseIdx >= session.workout.exercises.length - 1;

    if (!isLastSetInExercise) {
      set({
        completedSets,
        currentSetIdx: currentSetIdx + 1,
        isResting: true,
        restTimer: data.restSeconds,
      });
      return;
    }

    if (!isLastExercise) {
      set({
        completedSets,
        currentExerciseIdx: get().currentExerciseIdx + 1,
        currentSetIdx: 0,
        isResting: true,
        restTimer: data.restSeconds,
      });
      return;
    }

    set({
      completedSets,
      activeSession: { ...session, isCompleted: true },
      isResting: false,
      restTimer: null,
    });
  },

  startRest: (seconds) => set({ isResting: true, restTimer: Math.max(0, seconds) }),
  skipRest: () => set({ isResting: false, restTimer: null }),
  pauseSession: () => set({ isPaused: true }),
  resumeSession: () => set({ isPaused: false }),

  tickSession: () => {
    const activeSession = get().activeSession;
    if (!activeSession || get().isPaused) {
      return;
    }

    const nextState: Partial<WorkoutStore> = {
      sessionTimer: get().sessionTimer + 1,
    };

    const restTimer = get().restTimer;
    if (get().isResting && restTimer !== null) {
      const remaining = Math.max(0, restTimer - 1);
      nextState.restTimer = remaining;
      if (remaining === 0) {
        nextState.isResting = false;
        nextState.restTimer = null;
      }
    }

    set(nextState as Pick<WorkoutStore, "sessionTimer" | "restTimer" | "isResting">);
  },

  endSession: () => {
    const session = get().activeSession;
    if (!session) {
      return null;
    }

    const completedSets = get().completedSets;
    const volumeKg = completedSets.reduce((total, current) => total + current.weightKg * current.repsCompleted, 0);
    const summary: WorkoutSummary = {
      sessionId: session.sessionId,
      workoutId: session.workout.id,
      workoutName: session.workout.name,
      durationSeconds: get().sessionTimer,
      exercisesCompleted: new Set(completedSets.map((current) => current.exerciseId)).size,
      setsCompleted: completedSets.length,
      volumeKg,
      estimatedCalories: Math.round(session.workout.caloriesEstimate * Math.min(1, completedSets.length / 18)),
      completedAt: new Date().toISOString(),
      personalBests: [],
    };

    set({
      activeSession: null,
      currentExerciseIdx: 0,
      currentSetIdx: 0,
      sessionTimer: 0,
      restTimer: null,
      isResting: false,
      isPaused: false,
      completedSets: [],
      sessionStartTime: null,
    });

    return summary;
  },

  nextExercise: () => {
    const session = get().activeSession;
    if (!session) {
      return;
    }

    set((state) => ({
      currentExerciseIdx: Math.min(state.currentExerciseIdx + 1, session.workout.exercises.length - 1),
      currentSetIdx: 0,
      isResting: false,
      restTimer: null,
    }));
  },

  prevExercise: () => {
    set((state) => ({
      currentExerciseIdx: Math.max(state.currentExerciseIdx - 1, 0),
      currentSetIdx: 0,
      isResting: false,
      restTimer: null,
    }));
  },

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaylist: (playlist) => set({ playlist }),
}));
