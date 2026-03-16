import { useEffect, useEffectEvent, type ComponentType } from "react";
import { StyleSheet, View } from "react-native";

import type {
  MofitnessPoseViewProps,
  NativePoseStatus,
  PoseFrameEventPayload,
  PoseStatusEventPayload,
} from "../../../../modules/mofitness-pose/src/MofitnessPose.types";

import type { ExerciseConfig, PoseEngineStatus, PoseEngineTelemetry, PoseFrame, PoseLandmarks } from "../types";

interface PoseEngineProps {
  cameraFacing: "front" | "back";
  exercise: ExerciseConfig;
  running: boolean;
  onFrame: (frame: PoseFrame) => void;
  onStatusChange?: (status: PoseEngineStatus, telemetry?: PoseEngineTelemetry) => void;
}

const TARGET_FPS = 30;
const REDUCED_FPS_EXERCISES = new Set(["plank", "russian_twist", "crunch", "leg_raise"]);

let SafeMofitnessPoseView: ComponentType<MofitnessPoseViewProps> | null = null;
try {
  const poseModule = require("../../../../modules/mofitness-pose") as {
    MofitnessPoseView?: ComponentType<MofitnessPoseViewProps>;
  };
  SafeMofitnessPoseView = poseModule.MofitnessPoseView ?? null;
} catch {
  SafeMofitnessPoseView = null;
}

const statusMap: Record<NativePoseStatus, PoseEngineStatus> = {
  idle: "idle",
  initializing: "initializing",
  ready: "ready",
  tracking: "tracking",
  no_pose: "no_pose",
  paused: "paused",
  unavailable: "unavailable",
  error: "error",
};

const targetFpsForExercise = (exerciseId: string) => (REDUCED_FPS_EXERCISES.has(exerciseId) ? 24 : TARGET_FPS);

export function PoseEngine({ cameraFacing, exercise, running, onFrame, onStatusChange }: PoseEngineProps) {
  useEffect(() => {
    if (!SafeMofitnessPoseView) {
      onStatusChange?.("unavailable");
      return;
    }
    onStatusChange?.(running ? "initializing" : "paused");
  }, [onStatusChange, running]);

  const handlePoseFrame = useEffectEvent((payload: PoseFrameEventPayload) => {
    if (payload.landmarks.length < 33) {
      onStatusChange?.("no_pose");
      return;
    }

    onFrame({
      landmarks: payload.landmarks as PoseLandmarks,
      timestamp: payload.timestamp,
      frameWidth: payload.frameWidth,
      frameHeight: payload.frameHeight,
      inferenceTimeMs: payload.inferenceTimeMs,
    });
  });

  const handleStatusChange = useEffectEvent((payload: PoseStatusEventPayload) => {
    onStatusChange?.(statusMap[payload.status], {
      targetFps: payload.targetFps ?? payload.fps,
      actualFps: payload.actualFps,
      droppedFrames: payload.droppedFrames,
      processedFrames: payload.processedFrames,
      thermalLevel: payload.thermalLevel,
    });
  });

  if (!SafeMofitnessPoseView) {
    return <View style={StyleSheet.absoluteFill} />;
  }

  return (
    <SafeMofitnessPoseView
      active={running}
      cameraFacing={cameraFacing}
      minPoseDetectionConfidence={0.55}
      minPosePresenceConfidence={0.55}
      minTrackingConfidence={0.55}
      numPoses={1}
      onPoseFrame={(event) => handlePoseFrame(event.nativeEvent)}
      onStatusChange={(event) => handleStatusChange(event.nativeEvent)}
      style={StyleSheet.absoluteFill}
      targetFps={targetFpsForExercise(exercise.id)}
    />
  );
}
