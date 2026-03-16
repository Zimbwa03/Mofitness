import { StyleSheet } from "react-native";
import Svg from "react-native-svg";

import { JOINT_CONNECTIONS, LANDMARK_NAMES, POSE_LANDMARKS } from "../landmarks";
import { colors } from "../../../theme";
import type { ActiveFormError, Landmark, PoseLandmarks } from "../types";
import { AngleArc } from "./AngleArc";
import { BoneLine } from "./BoneLine";
import { JointNode } from "./JointNode";

type Point = { x: number; y: number };

interface SkeletonOverlayProps {
  landmarks: PoseLandmarks;
  errors: ActiveFormError[];
  screenWidth: number;
  screenHeight: number;
}

const jointMap = {
  LEFT_KNEE: POSE_LANDMARKS.LEFT_KNEE,
  RIGHT_KNEE: POSE_LANDMARKS.RIGHT_KNEE,
  LEFT_ANKLE: POSE_LANDMARKS.LEFT_ANKLE,
  RIGHT_ANKLE: POSE_LANDMARKS.RIGHT_ANKLE,
  LEFT_ELBOW: POSE_LANDMARKS.LEFT_ELBOW,
  RIGHT_ELBOW: POSE_LANDMARKS.RIGHT_ELBOW,
  LEFT_SHOULDER: POSE_LANDMARKS.LEFT_SHOULDER,
  RIGHT_SHOULDER: POSE_LANDMARKS.RIGHT_SHOULDER,
  LEFT_HIP: POSE_LANDMARKS.LEFT_HIP,
  RIGHT_HIP: POSE_LANDMARKS.RIGHT_HIP,
} as const;

export function SkeletonOverlay({ landmarks, errors, screenWidth, screenHeight }: SkeletonOverlayProps) {
  const toScreen = (landmark: Landmark): Point => ({
    x: landmark.x * screenWidth,
    y: landmark.y * screenHeight,
  });

  const getColorForJoint = (index: number) => {
    const name = LANDMARK_NAMES[index];
    const criticalMatch = errors.some((error) => error.severity === "critical" && error.joint === name);
    const warningMatch = errors.some((error) => error.severity === "warning" && error.joint === name);

    if (criticalMatch) {
      return colors.error;
    }
    if (warningMatch) {
      return colors.accent_amber;
    }
    return colors.accent_green;
  };

  return (
    <Svg width={screenWidth} height={screenHeight} style={StyleSheet.absoluteFill} pointerEvents="none">
      {JOINT_CONNECTIONS.map(([from, to]) => {
        const fromLandmark = landmarks[from];
        const toLandmark = landmarks[to];

        if (!fromLandmark || !toLandmark || fromLandmark.visibility < 0.3 || toLandmark.visibility < 0.3) {
          return null;
        }

        const fromPoint = toScreen(fromLandmark);
        const toPoint = toScreen(toLandmark);
        const color = getColorForJoint(from);

        return <BoneLine key={`bone-${from}-${to}`} x1={fromPoint.x} y1={fromPoint.y} x2={toPoint.x} y2={toPoint.y} color={color} />;
      })}

      {landmarks.map((landmark, index) => {
        if (!landmark || landmark.visibility < 0.3) {
          return null;
        }
        const point = toScreen(landmark);
        return <JointNode key={`joint-${index}`} cx={point.x} cy={point.y} color={getColorForJoint(index)} />;
      })}

      {errors.map((error) => {
        const targetIndex = jointMap[error.joint as keyof typeof jointMap];
        if (typeof targetIndex !== "number") {
          return null;
        }
        const target = landmarks[targetIndex];
        if (!target) {
          return null;
        }
        const point = toScreen(target);
        const color = error.severity === "critical" ? colors.error : error.severity === "warning" ? colors.accent_amber : colors.accent_green;
        return <AngleArc key={`arc-${error.id}`} cx={point.x} cy={point.y} color={color} />;
      })}
    </Svg>
  );
}
