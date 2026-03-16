import { create } from "zustand";

import { exerciseLookup } from "../exercises";
import type { FormSessionConfig, FormSessionSummary } from "../types";

interface FormCheckerState {
  consentAccepted: boolean;
  config: FormSessionConfig;
  history: FormSessionSummary[];
  lastSession: FormSessionSummary | null;
  acceptConsent: () => void;
  updateConfig: (patch: Partial<FormSessionConfig>) => void;
  saveSession: (session: FormSessionSummary) => void;
}

const defaultConfig: FormSessionConfig = {
  exerciseId: "squat",
  targetSets: 3,
  targetReps: 10,
  restSeconds: 90,
  voiceEnabled: true,
  sensitivity: "medium",
  cameraFacing: "front",
};

const seededHistory: FormSessionSummary[] = [
  {
    id: "seed-squat-1",
    exerciseId: "squat",
    exerciseName: "Squat",
    performedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    overallScore: 78,
    setsCompleted: 3,
    targetSets: 3,
    targetReps: 10,
    setBreakdown: [],
    topIssues: [
      {
        id: "knee_cave",
        cue: "Knees out",
        severity: "critical",
        count: 18,
        avgDurationMs: 620,
        mostCommonPhase: "bottom",
        fix: "Push the knees outward in line with your toes.",
      },
      {
        id: "forward_lean",
        cue: "Chest up",
        severity: "warning",
        count: 11,
        avgDurationMs: 540,
        mostCommonPhase: "down",
        fix: "Keep the upper back tighter and the chest proud.",
      },
    ],
    coach: null,
  },
  {
    id: "seed-squat-2",
    exerciseId: "squat",
    exerciseName: "Squat",
    performedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    overallScore: 84,
    setsCompleted: 3,
    targetSets: 3,
    targetReps: 10,
    setBreakdown: [],
    topIssues: [
      {
        id: "no_depth",
        cue: "Go deeper",
        severity: "warning",
        count: 8,
        avgDurationMs: 480,
        mostCommonPhase: "bottom",
        fix: "Sit lower while keeping full-foot pressure.",
      },
    ],
    coach: null,
  },
  {
    id: "seed-press-1",
    exerciseId: "shoulder_press",
    exerciseName: "Shoulder Press",
    performedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    overallScore: 81,
    setsCompleted: 4,
    targetSets: 4,
    targetReps: 8,
    setBreakdown: [],
    topIssues: [
      {
        id: "lower_back_arch",
        cue: "Brace core",
        severity: "critical",
        count: 9,
        avgDurationMs: 510,
        mostCommonPhase: "up",
        fix: "Tuck ribs down and squeeze the glutes before you press.",
      },
    ],
    coach: null,
  },
];

export const useFormCheckerStore = create<FormCheckerState>((set) => ({
  consentAccepted: false,
  config: defaultConfig,
  history: seededHistory,
  lastSession: null,
  acceptConsent: () => set({ consentAccepted: true }),
  updateConfig: (patch) =>
    set((state) => ({
      config: {
        ...state.config,
        ...patch,
        exerciseId: patch.exerciseId ?? state.config.exerciseId,
      },
    })),
  saveSession: (session) =>
    set((state) => ({
      lastSession: {
        ...session,
        exerciseName: exerciseLookup[session.exerciseId]?.name ?? session.exerciseName,
      },
      history: [session, ...state.history].slice(0, 12),
    })),
}));
