import { POSE_LANDMARKS } from "../landmarks";
import type { ExerciseAngles, Landmark, PoseLandmarks } from "../types";

export class JointCalculator {
  static calcAngle(a: Landmark, b: Landmark, c: Landmark): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);

    if (angle > 180.0) {
      angle = 360.0 - angle;
    }

    return angle;
  }

  static calcSegmentAngle(top: Landmark, bottom: Landmark): number {
    const dx = top.x - bottom.x;
    const dy = top.y - bottom.y;
    return Math.abs((Math.atan2(dx, dy) * 180) / Math.PI);
  }

  static calcRelativeAngle(start: Landmark, end: Landmark, reference: "horizontal" | "vertical"): number {
    const angle = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
    return reference === "horizontal" ? angle : angle - 90;
  }

  static calcSymmetry(left: Landmark, right: Landmark): number {
    return Math.abs(left.y - right.y);
  }

  static calcDistance(a: Landmark, b: Landmark): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }

  static midpoint(a: Landmark, b: Landmark): Landmark {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      z: (a.z + b.z) / 2,
      visibility: Math.min(a.visibility, b.visibility),
    };
  }

  static calcSignedOffsetFromLine(point: Landmark, lineStart: Landmark, lineEnd: Landmark): number {
    const numerator =
      (lineEnd.x - lineStart.x) * (lineStart.y - point.y) - (lineStart.x - point.x) * (lineEnd.y - lineStart.y);
    const denominator = Math.max(this.calcDistance(lineStart, lineEnd), 0.0001);
    return numerator / denominator;
  }

  static extractAngles(lm: PoseLandmarks): ExerciseAngles {
    const L = POSE_LANDMARKS;
    const shoulderMid = this.midpoint(lm[L.LEFT_SHOULDER], lm[L.RIGHT_SHOULDER]);
    const hipMid = this.midpoint(lm[L.LEFT_HIP], lm[L.RIGHT_HIP]);
    const ankleMid = this.midpoint(lm[L.LEFT_ANKLE], lm[L.RIGHT_ANKLE]);

    return {
      leftKneeAngle: this.calcAngle(lm[L.LEFT_HIP], lm[L.LEFT_KNEE], lm[L.LEFT_ANKLE]),
      rightKneeAngle: this.calcAngle(lm[L.RIGHT_HIP], lm[L.RIGHT_KNEE], lm[L.RIGHT_ANKLE]),
      leftHipAngle: this.calcAngle(lm[L.LEFT_SHOULDER], lm[L.LEFT_HIP], lm[L.LEFT_KNEE]),
      rightHipAngle: this.calcAngle(lm[L.RIGHT_SHOULDER], lm[L.RIGHT_HIP], lm[L.RIGHT_KNEE]),
      leftAnkleAngle: this.calcAngle(lm[L.LEFT_KNEE], lm[L.LEFT_ANKLE], lm[L.LEFT_HEEL]),
      rightAnkleAngle: this.calcAngle(lm[L.RIGHT_KNEE], lm[L.RIGHT_ANKLE], lm[L.RIGHT_HEEL]),
      leftElbowAngle: this.calcAngle(lm[L.LEFT_SHOULDER], lm[L.LEFT_ELBOW], lm[L.LEFT_WRIST]),
      rightElbowAngle: this.calcAngle(lm[L.RIGHT_SHOULDER], lm[L.RIGHT_ELBOW], lm[L.RIGHT_WRIST]),
      leftShoulderAngle: this.calcAngle(lm[L.LEFT_ELBOW], lm[L.LEFT_SHOULDER], lm[L.LEFT_HIP]),
      rightShoulderAngle: this.calcAngle(lm[L.RIGHT_ELBOW], lm[L.RIGHT_SHOULDER], lm[L.RIGHT_HIP]),
      torsoLeanAngle: this.calcSegmentAngle(shoulderMid, hipMid),
      bodyLineAngle: this.calcRelativeAngle(shoulderMid, ankleMid, "horizontal"),
      hipDrop: this.calcSignedOffsetFromLine(hipMid, shoulderMid, ankleMid),
      hipLevelDiff: this.calcSymmetry(lm[L.LEFT_HIP], lm[L.RIGHT_HIP]),
      shoulderLevelDiff: this.calcSymmetry(lm[L.LEFT_SHOULDER], lm[L.RIGHT_SHOULDER]),
      kneeLevelDiff: this.calcSymmetry(lm[L.LEFT_KNEE], lm[L.RIGHT_KNEE]),
      handHeightDiff: Math.abs(lm[L.LEFT_WRIST].y - lm[L.RIGHT_WRIST].y),
      wristLevelDiff: Math.abs(lm[L.LEFT_WRIST].y - lm[L.RIGHT_WRIST].y),
      ankleDistance: this.calcDistance(lm[L.LEFT_ANKLE], lm[L.RIGHT_ANKLE]),
      wristDistance: this.calcDistance(lm[L.LEFT_WRIST], lm[L.RIGHT_WRIST]),
      leftKneeOverToe: lm[L.LEFT_KNEE].x - lm[L.LEFT_FOOT_INDEX].x,
      rightKneeOverToe: lm[L.RIGHT_FOOT_INDEX].x - lm[L.RIGHT_KNEE].x,
    };
  }
}
