import type { StyleProp, ViewStyle } from "react-native";

export type NativePoseStatus =
  | "idle"
  | "initializing"
  | "ready"
  | "tracking"
  | "no_pose"
  | "paused"
  | "unavailable"
  | "error";

export type NativeThermalLevel = "nominal" | "fair" | "moderate" | "serious" | "critical" | "shutdown" | "unknown";

export interface PoseLandmarkPayload {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseFrameEventPayload {
  landmarks: PoseLandmarkPayload[];
  timestamp: number;
  frameWidth: number;
  frameHeight: number;
  inferenceTimeMs?: number;
}

export interface PoseStatusEventPayload {
  status: NativePoseStatus;
  message?: string;
  fps?: number;
  targetFps?: number;
  actualFps?: number;
  droppedFrames?: number;
  processedFrames?: number;
  thermalLevel?: NativeThermalLevel;
}

export type MofitnessPoseModuleEvents = Record<string, never>;

export interface MofitnessPoseCapabilities {
  implementation: "native-live-stream" | "stub";
  maxRecommendedFps: number;
}

export interface MofitnessPoseViewProps {
  active?: boolean;
  cameraFacing?: "front" | "back";
  targetFps?: number;
  numPoses?: number;
  minPoseDetectionConfidence?: number;
  minPosePresenceConfidence?: number;
  minTrackingConfidence?: number;
  onPoseFrame?: (event: { nativeEvent: PoseFrameEventPayload }) => void;
  onStatusChange?: (event: { nativeEvent: PoseStatusEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
}
