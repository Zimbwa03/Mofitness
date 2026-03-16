import type { POSE_LANDMARKS } from "./landmarks";

export type PoseLandmarkName = keyof typeof POSE_LANDMARKS;
export type ExercisePhase = "up" | "down" | "bottom" | "top" | "unknown";
export type FormErrorSeverity = "critical" | "warning" | "info";
export type CoachingSensitivity = "low" | "medium" | "high";
export type FormCameraPosition = "side" | "front" | "side_or_front";
export type FormCategory = "strength" | "cardio" | "flexibility" | "core";
export type PoseEngineStatus = "idle" | "initializing" | "ready" | "tracking" | "no_pose" | "paused" | "unavailable" | "error";
export type PoseThermalLevel = "nominal" | "fair" | "moderate" | "serious" | "critical" | "shutdown" | "unknown";

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export type PoseLandmarks = Landmark[];

export interface PoseFrame {
  landmarks: PoseLandmarks;
  timestamp: number;
  frameWidth?: number;
  frameHeight?: number;
  inferenceTimeMs?: number;
}

export interface PoseEngineTelemetry {
  targetFps?: number;
  actualFps?: number;
  droppedFrames?: number;
  processedFrames?: number;
  thermalLevel?: PoseThermalLevel;
  frameWidth?: number;
  frameHeight?: number;
  inferenceTimeMs?: number;
}

export interface ExerciseAngles {
  leftKneeAngle: number;
  rightKneeAngle: number;
  leftHipAngle: number;
  rightHipAngle: number;
  leftAnkleAngle: number;
  rightAnkleAngle: number;
  leftElbowAngle: number;
  rightElbowAngle: number;
  leftShoulderAngle: number;
  rightShoulderAngle: number;
  torsoLeanAngle: number;
  bodyLineAngle: number;
  hipDrop: number;
  hipLevelDiff: number;
  shoulderLevelDiff: number;
  kneeLevelDiff: number;
  handHeightDiff: number;
  wristLevelDiff: number;
  ankleDistance: number;
  wristDistance: number;
  leftKneeOverToe: number;
  rightKneeOverToe: number;
}

export interface FormError {
  id: string;
  severity: FormErrorSeverity;
  joint: PoseLandmarkName | "torso" | "hips" | "spine";
  message: string;
  cue: string;
  fix: string;
  minDuration: number;
}

export interface FormRule {
  id: string;
  check: (angles: ExerciseAngles, phase: ExercisePhase) => boolean;
  error: FormError;
}

export interface ExerciseConfig {
  id: string;
  name: string;
  category: FormCategory;
  cameraPosition: FormCameraPosition;
  idealDistance: [number, number];
  primaryAngleKey: keyof ExerciseAngles;
  repThresholds: {
    topAngleRange: [number, number];
    bottomAngleRange: [number, number];
  };
  formRules: FormRule[];
  phaseCues: {
    concentric: string;
    eccentric: string;
    top: string;
    bottom: string;
  };
  muscles: string[];
  cameraHeight: string;
  description: string;
  setupNotes: string[];
}

export interface RepUpdate {
  repCount: number;
  currentPhase: ExercisePhase;
  primaryAngle: number;
  phaseProgress: number;
}

export interface ActiveFormError extends FormError {
  activeSince: number;
  duration: number;
}

export interface FormAnalysisResult {
  errors: ActiveFormError[];
  formScore: number;
  sessionScore: number;
  phase: ExercisePhase;
  repCount: number;
  primaryAngle: number;
}

export interface RepHistory {
  repNumber: number;
  formScore: number;
  primaryAngle: number;
  eccentricMs: number;
  concentricMs: number;
  phase: ExercisePhase;
}

export interface ErrorHistory {
  id: string;
  cue: string;
  severity: FormErrorSeverity;
  count: number;
  avgDurationMs: number;
  mostCommonPhase: ExercisePhase;
  fix: string;
}

export interface FormCoachResponse {
  primary_issue: string | null;
  secondary_issue: string | null;
  positive_note: string | null;
  tempo_feedback: string | null;
  drill_suggestion: string | null;
  spoken_summary: string;
  overall_rating: "excellent" | "good" | "needs_work" | "poor";
}

export interface FormSetSummary {
  setNumber: number;
  repTarget: number;
  repCount: number;
  averageScore: number;
  repQuality: number[];
  repHistory: RepHistory[];
  topErrors: ErrorHistory[];
}

export interface FormSessionSummary {
  id: string;
  exerciseId: string;
  exerciseName: string;
  performedAt: string;
  overallScore: number;
  setsCompleted: number;
  targetSets: number;
  targetReps: number;
  setBreakdown: FormSetSummary[];
  topIssues: ErrorHistory[];
  coach: FormCoachResponse | null;
}

export interface FormSessionConfig {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  voiceEnabled: boolean;
  sensitivity: CoachingSensitivity;
  cameraFacing: "front" | "back";
}
