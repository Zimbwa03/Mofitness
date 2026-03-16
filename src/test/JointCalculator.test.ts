import { JointCalculator } from "../features/formChecker/engine/JointCalculator";

describe("JointCalculator", () => {
  it("calculates knee angle correctly for standing position", () => {
    const hip = { x: 0.5, y: 0.4, z: 0, visibility: 1 };
    const knee = { x: 0.5, y: 0.6, z: 0, visibility: 1 };
    const ankle = { x: 0.5, y: 0.8, z: 0, visibility: 1 };

    expect(JointCalculator.calcAngle(hip, knee, ankle)).toBeCloseTo(180, 0);
  });

  it("calculates knee angle correctly for parallel squat depth", () => {
    const hip = { x: 0.3, y: 0.66, z: 0, visibility: 1 };
    const knee = { x: 0.46, y: 0.66, z: 0, visibility: 1 };
    const ankle = { x: 0.46, y: 0.86, z: 0, visibility: 1 };
    const angle = JointCalculator.calcAngle(hip, knee, ankle);

    expect(angle).toBeGreaterThan(80);
    expect(angle).toBeLessThan(100);
  });
});
