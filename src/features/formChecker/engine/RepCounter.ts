import type { ExerciseAngles, ExerciseConfig, ExercisePhase, RepUpdate } from "../types";

export class RepCounter {
  private phase: ExercisePhase = "unknown";
  private repCount = 0;
  private phaseHistory: ExercisePhase[] = [];
  private lastAngle: number | null = null;
  private readonly exercise: ExerciseConfig;

  constructor(exercise: ExerciseConfig) {
    this.exercise = exercise;
  }

  update(angles: ExerciseAngles): RepUpdate {
    const primaryAngle = this.getPrimaryAngle(angles);
    const newPhase = this.detectPhase(primaryAngle);

    this.phaseHistory.push(newPhase);
    if (this.phaseHistory.length > 5) {
      this.phaseHistory.shift();
    }

    const stablePhase = this.getMajorityPhase(this.phaseHistory);

    if (this.phase === "bottom" && stablePhase === "up") {
      this.repCount += 1;
    }

    this.phase = stablePhase;
    this.lastAngle = primaryAngle;

    return {
      repCount: this.repCount,
      currentPhase: this.phase,
      primaryAngle,
      phaseProgress: this.calcPhaseProgress(primaryAngle),
    };
  }

  reset() {
    this.phase = "unknown";
    this.repCount = 0;
    this.phaseHistory = [];
    this.lastAngle = null;
  }

  private detectPhase(angle: number): ExercisePhase {
    const { topAngleRange, bottomAngleRange } = this.exercise.repThresholds;

    if (angle >= topAngleRange[0] && angle <= topAngleRange[1]) {
      return "top";
    }

    if (angle >= bottomAngleRange[0] && angle <= bottomAngleRange[1]) {
      return "bottom";
    }

    if (this.lastAngle === null) {
      return "unknown";
    }

    const topMid = (topAngleRange[0] + topAngleRange[1]) / 2;
    const currentDistance = Math.abs(angle - topMid);
    const previousDistance = Math.abs(this.lastAngle - topMid);

    return currentDistance <= previousDistance ? "up" : "down";
  }

  private getPrimaryAngle(angles: ExerciseAngles): number {
    return angles[this.exercise.primaryAngleKey];
  }

  private getMajorityPhase(phases: ExercisePhase[]): ExercisePhase {
    const counts = phases.reduce<Record<ExercisePhase, number>>(
      (acc, phase) => {
        acc[phase] += 1;
        return acc;
      },
      {
        up: 0,
        down: 0,
        bottom: 0,
        top: 0,
        unknown: 0,
      },
    );

    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as ExercisePhase) ?? "unknown";
  }

  private calcPhaseProgress(angle: number): number {
    const { topAngleRange, bottomAngleRange } = this.exercise.repThresholds;
    const topMid = (topAngleRange[0] + topAngleRange[1]) / 2;
    const bottomMid = (bottomAngleRange[0] + bottomAngleRange[1]) / 2;
    const span = Math.max(Math.abs(topMid - bottomMid), 1);
    const progress = 1 - Math.abs(angle - topMid) / span;
    return Math.max(0, Math.min(1, progress));
  }
}
