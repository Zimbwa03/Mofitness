import { FormAnalyser } from "../features/formChecker/engine/FormAnalyser";
import { POSE_LANDMARKS } from "../features/formChecker/landmarks";
import { exerciseLookup } from "../features/formChecker/exercises";
import type { PoseLandmarks } from "../features/formChecker/types";

const SQUAT_CONFIG = exerciseLookup.squat;

function createEmptyPose(): PoseLandmarks {
  return Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
}

function setSymmetricPoint(landmarks: PoseLandmarks, leftIndex: number, rightIndex: number, leftX: number, y: number, rightX = 1 - leftX) {
  landmarks[leftIndex] = { x: leftX, y, z: 0, visibility: 1 };
  landmarks[rightIndex] = { x: rightX, y, z: 0, visibility: 1 };
}

function buildSquatPose(phase: "standing" | "mid" | "bottom", kneeCave = false): PoseLandmarks {
  const landmarks = createEmptyPose();

  setSymmetricPoint(landmarks, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, 0.42, phase === "standing" ? 0.25 : phase === "mid" ? 0.28 : 0.32);

  if (phase === "standing") {
    setSymmetricPoint(landmarks, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP, 0.46, 0.45);
    setSymmetricPoint(landmarks, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE, 0.46, 0.65);
    setSymmetricPoint(landmarks, POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE, 0.46, 0.85);
  } else if (phase === "mid") {
    setSymmetricPoint(landmarks, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP, 0.36, 0.58);
    setSymmetricPoint(landmarks, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE, 0.46, 0.65);
    setSymmetricPoint(landmarks, POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE, 0.46, 0.85);
  } else {
    setSymmetricPoint(landmarks, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP, 0.26, 0.66);
    setSymmetricPoint(landmarks, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE, 0.46, 0.66);
    setSymmetricPoint(landmarks, POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE, 0.46, 0.86);
  }

  const leftFootIndex = phase === "bottom" && kneeCave ? 0.36 : 0.43;
  const rightFootIndex = phase === "bottom" && kneeCave ? 0.64 : 0.57;
  landmarks[POSE_LANDMARKS.LEFT_FOOT_INDEX] = { x: leftFootIndex, y: 0.89, z: 0, visibility: 1 };
  landmarks[POSE_LANDMARKS.RIGHT_FOOT_INDEX] = { x: rightFootIndex, y: 0.89, z: 0, visibility: 1 };
  landmarks[POSE_LANDMARKS.LEFT_HEEL] = { x: 0.45, y: 0.88, z: 0, visibility: 1 };
  landmarks[POSE_LANDMARKS.RIGHT_HEEL] = { x: 0.55, y: 0.88, z: 0, visibility: 1 };
  landmarks[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.37, y: 0.4, z: 0, visibility: 1 };
  landmarks[POSE_LANDMARKS.RIGHT_ELBOW] = { x: 0.63, y: 0.4, z: 0, visibility: 1 };
  landmarks[POSE_LANDMARKS.LEFT_WRIST] = { x: 0.35, y: 0.55, z: 0, visibility: 1 };
  landmarks[POSE_LANDMARKS.RIGHT_WRIST] = { x: 0.65, y: 0.55, z: 0, visibility: 1 };

  return landmarks;
}

describe("FormAnalyser - Squat", () => {
  let now = 0;

  beforeEach(() => {
    now = 0;
    jest.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("detects knee cave when knees are collapsing inward", () => {
    const analyser = new FormAnalyser(SQUAT_CONFIG);
    analyser.analyse(buildSquatPose("standing"));

    let result = analyser.analyse(buildSquatPose("bottom", true));
    for (let frame = 0; frame < 12; frame += 1) {
      now += 80;
      result = analyser.analyse(buildSquatPose("bottom", true));
    }

    expect(result.errors.some((error) => error.id === "knee_cave")).toBe(true);
  });

  it("does not fire knee cave on valid squat form", () => {
    const analyser = new FormAnalyser(SQUAT_CONFIG);

    analyser.analyse(buildSquatPose("standing"));
    let result = analyser.analyse(buildSquatPose("bottom"));
    for (let frame = 0; frame < 10; frame += 1) {
      now += 70;
      result = analyser.analyse(buildSquatPose("bottom"));
    }

    expect(result.errors.some((error) => error.id === "knee_cave")).toBe(false);
  });

  it("counts reps correctly through a full squat cycle", () => {
    const analyser = new FormAnalyser(SQUAT_CONFIG);
    const cycle = [
      ...Array.from({ length: 5 }, () => buildSquatPose("standing")),
      ...Array.from({ length: 5 }, () => buildSquatPose("mid")),
      ...Array.from({ length: 5 }, () => buildSquatPose("bottom")),
      ...Array.from({ length: 5 }, () => buildSquatPose("mid")),
      ...Array.from({ length: 5 }, () => buildSquatPose("standing")),
    ];

    let final = analyser.analyse(buildSquatPose("standing"));

    for (let rep = 0; rep < 5; rep += 1) {
      cycle.forEach((frame) => {
        now += 50;
        final = analyser.analyse(frame);
      });
    }

    expect(final.repCount).toBe(5);
  });

  it("form score drops for a sustained critical error", () => {
    const analyser = new FormAnalyser(SQUAT_CONFIG);
    analyser.analyse(buildSquatPose("standing"));

    let result = analyser.analyse(buildSquatPose("bottom", true));
    for (let frame = 0; frame < 14; frame += 1) {
      now += 90;
      result = analyser.analyse(buildSquatPose("bottom", true));
    }

    expect(result.formScore).toBeLessThan(80);
  });
});
