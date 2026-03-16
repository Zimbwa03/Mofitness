import { POSE_LANDMARKS } from "../landmarks";
import type { ActiveFormError, ExerciseConfig, FormAnalysisResult, PoseLandmarks } from "../types";
import { JointCalculator } from "./JointCalculator";
import { RepCounter } from "./RepCounter";

export class FormAnalyser {
  private config: ExerciseConfig;
  private repCounter: RepCounter;
  private activeErrors = new Map<string, ActiveFormError>();
  private frameScores: number[] = [];
  private sessionScore = 100;
  private lastResult: FormAnalysisResult = {
    errors: [],
    formScore: 100,
    sessionScore: 100,
    phase: "unknown",
    repCount: 0,
    primaryAngle: 0,
  };

  constructor(config: ExerciseConfig) {
    this.config = config;
    this.repCounter = new RepCounter(config);
  }

  analyse(landmarks: PoseLandmarks): FormAnalysisResult {
    if (!this.allKeyLandmarksVisible(landmarks)) {
      return this.lastResult;
    }

    const angles = JointCalculator.extractAngles(landmarks);
    const repData = this.repCounter.update(angles);
    const currentErrors = new Set<string>();
    const now = Date.now();

    for (const rule of this.config.formRules) {
      const hasFault = rule.check(angles, repData.currentPhase);

      if (hasFault) {
        currentErrors.add(rule.id);
        const existing = this.activeErrors.get(rule.id);

        if (existing) {
          existing.duration = now - existing.activeSince;
        } else {
          this.activeErrors.set(rule.id, {
            ...rule.error,
            activeSince: now,
            duration: 0,
          });
        }
      } else {
        this.activeErrors.delete(rule.id);
      }
    }

    for (const id of Array.from(this.activeErrors.keys())) {
      if (!currentErrors.has(id)) {
        this.activeErrors.delete(id);
      }
    }

    let frameScore = 100;
    const sevDeductions = { critical: 30, warning: 15, info: 5 };
    for (const error of this.activeErrors.values()) {
      if (error.duration > error.minDuration) {
        frameScore -= sevDeductions[error.severity];
      }
    }
    frameScore = Math.max(0, frameScore);

    this.frameScores.push(frameScore);
    if (this.frameScores.length > 240) {
      this.frameScores.shift();
    }
    this.sessionScore = this.frameScores.reduce((sum, value) => sum + value, 0) / this.frameScores.length;

    this.lastResult = {
      errors: Array.from(this.activeErrors.values()).filter((error) => error.duration > error.minDuration),
      formScore: frameScore,
      sessionScore: Math.round(this.sessionScore),
      phase: repData.currentPhase,
      repCount: repData.repCount,
      primaryAngle: repData.primaryAngle,
    };

    return this.lastResult;
  }

  reset() {
    this.repCounter.reset();
    this.activeErrors.clear();
    this.frameScores = [];
    this.sessionScore = 100;
    this.lastResult = {
      errors: [],
      formScore: 100,
      sessionScore: 100,
      phase: "unknown",
      repCount: 0,
      primaryAngle: 0,
    };
  }

  private allKeyLandmarksVisible(landmarks: PoseLandmarks) {
    const required = [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ];

    return required.every((index) => landmarks[index] && landmarks[index].visibility > 0.25);
  }
}
