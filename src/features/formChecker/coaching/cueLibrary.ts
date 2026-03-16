import type { CoachingSensitivity } from "../types";

export const sensitivityDescriptions: Record<CoachingSensitivity, string> = {
  low: "Critical errors only",
  medium: "Critical plus warnings",
  high: "All cues and pacing guidance",
};

export const setupChecklist = [
  "Full body visible in frame",
  "Phone 1.5 to 2.5 metres away",
  "Camera roughly at hip height",
  "Brighter light improves tracking",
];

export const engineStatusCopy = {
  initializing: "Starting native pose tracker",
  ready: "Camera ready",
  tracking: "Body detected",
  no_pose: "Move until your full body is visible",
  idle: "Waiting for camera",
  paused: "Tracking paused",
  unavailable: "Native tracker unavailable in this build",
  error: "Tracker error",
};
