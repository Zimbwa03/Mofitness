import { create } from "zustand";

import type { KmSplit, RoutePoint, RunConfig, RunPhase, RunSummarySnapshot } from "../models";

type CoachAlertType = "pace_too_slow" | "pace_too_fast" | "hr_too_high";

export interface RunEvent {
  type: "km_milestone" | "coach_alert";
  payload: Record<string, number | string>;
}

interface RunStore {
  phase: RunPhase;
  config: RunConfig | null;
  startedAt: string | null;
  endedAt: string | null;
  elapsedSeconds: number;
  pausedSeconds: number;
  routePoints: RoutePoint[];
  renderedRoutePoints: RoutePoint[];
  kmSplits: KmSplit[];
  kmMarkers: Array<{ km: number; point: RoutePoint; timestamp: number }>;
  distanceMeters: number;
  elevationGainM: number;
  elevationLossM: number;
  instantPaceSecPerKm: number;
  avgPaceSecPerKm: number;
  bestPaceSecPerKm: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  totalSteps: number;
  avgCadenceSpm: number;
  avgStrideLengthM: number;
  caloriesBurned: number;
  heartRateBpm: number | null;
  avgHeartRateBpm: number | null;
  maxHeartRateBpm: number | null;
  coachMessage: string | null;
  pendingEvents: RunEvent[];
  lastAlertSecond: number;
  warmupRemainingSeconds: number;
  configureRun: (config: RunConfig) => void;
  startCountdown: () => void;
  startWarmup: (seconds?: number) => void;
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  tick: () => void;
  addRoutePoint: (point: RoutePoint) => void;
  setHeartRate: (bpm: number | null) => void;
  setSteps: (steps: number) => void;
  setCoachMessage: (message: string | null) => void;
  pushEvent: (event: RunEvent) => void;
  shiftEvent: () => RunEvent | null;
  completeRun: () => RunSummarySnapshot;
  resetRun: () => void;
}

const defaultStrideM = 0.75;

function distanceBetween(p1: RoutePoint, p2: RoutePoint) {
  const R = 6371000;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateTotalDistance(points: RoutePoint[]) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distanceBetween(points[i - 1], points[i]);
  }
  return total;
}

function metForPace(paceSecPerKm: number) {
  if (!paceSecPerKm) {
    return 0;
  }
  if (paceSecPerKm > 480) {
    return 3.5;
  }
  if (paceSecPerKm > 420) {
    return 7.0;
  }
  if (paceSecPerKm > 300) {
    return 9.8;
  }
  if (paceSecPerKm > 240) {
    return 11.8;
  }
  return 14.0;
}

function estimateCalories(durationSec: number, paceSecPerKm: number, weightKg = 72) {
  const met = metForPace(paceSecPerKm);
  if (!met) {
    return 0;
  }
  const durationMin = durationSec / 60;
  return Math.round((met * weightKg * durationMin) / 60);
}

function rollingPace(points: RoutePoint[]) {
  const now = Date.now();
  const last30s = points.filter((point) => point.timestamp >= now - 30000);
  if (last30s.length < 2) {
    return 0;
  }
  const distanceM = calculateTotalDistance(last30s);
  const elapsedSec = (last30s[last30s.length - 1].timestamp - last30s[0].timestamp) / 1000;
  return distanceM > 0 ? (1000 / distanceM) * elapsedSec : 0;
}

function currentKmSplitSeconds(elapsedSeconds: number, kmSplits: KmSplit[]) {
  const completedSplitSec = kmSplits.reduce((total, split) => total + split.paceSec, 0);
  return Math.max(0, elapsedSeconds - completedSplitSec);
}

const initialState = {
  phase: "idle" as RunPhase,
  config: null as RunConfig | null,
  startedAt: null as string | null,
  endedAt: null as string | null,
  elapsedSeconds: 0,
  pausedSeconds: 0,
  routePoints: [] as RoutePoint[],
  renderedRoutePoints: [] as RoutePoint[],
  kmSplits: [] as KmSplit[],
  kmMarkers: [] as Array<{ km: number; point: RoutePoint; timestamp: number }>,
  distanceMeters: 0,
  elevationGainM: 0,
  elevationLossM: 0,
  instantPaceSecPerKm: 0,
  avgPaceSecPerKm: 0,
  bestPaceSecPerKm: 0,
  avgSpeedKmh: 0,
  maxSpeedKmh: 0,
  totalSteps: 0,
  avgCadenceSpm: 0,
  avgStrideLengthM: defaultStrideM,
  caloriesBurned: 0,
  heartRateBpm: null as number | null,
  avgHeartRateBpm: null as number | null,
  maxHeartRateBpm: null as number | null,
  coachMessage: null as string | null,
  pendingEvents: [] as RunEvent[],
  lastAlertSecond: 0,
  warmupRemainingSeconds: 0,
};

export const useRunStore = create<RunStore>((set, get) => ({
  ...initialState,
  configureRun: (config) => set({ config, phase: "idle" }),
  startCountdown: () => set({ phase: "countdown", startedAt: new Date().toISOString(), endedAt: null }),
  startWarmup: (seconds = 300) => set({ phase: "warmup", warmupRemainingSeconds: seconds }),
  startRun: () => set({ phase: "active" }),
  pauseRun: () => set({ phase: "paused" }),
  resumeRun: () => set({ phase: "active" }),
  tick: () => {
    const state = get();
    if (state.phase === "paused") {
      set({ pausedSeconds: state.pausedSeconds + 1 });
      return;
    }

    if (state.phase === "warmup") {
      const nextWarmup = Math.max(0, state.warmupRemainingSeconds - 1);
      set({ warmupRemainingSeconds: nextWarmup, elapsedSeconds: state.elapsedSeconds + 1 });
      if (nextWarmup === 0) {
        set({ phase: "active", coachMessage: "Warmup complete. Settle into your target pace." });
      }
      return;
    }

    if (state.phase !== "active") {
      return;
    }

    const nextElapsed = state.elapsedSeconds + 1;
    const nextCalories = estimateCalories(nextElapsed, state.avgPaceSecPerKm);

    const nextState: Partial<RunStore> = {
      elapsedSeconds: nextElapsed,
      caloriesBurned: nextCalories,
      avgCadenceSpm: nextElapsed > 0 ? Math.round((state.totalSteps / nextElapsed) * 60) : 0,
      avgStrideLengthM: state.totalSteps > 0 ? state.distanceMeters / state.totalSteps : defaultStrideM,
    };

    if (state.config?.target.paceSecPerKm && nextElapsed - state.lastAlertSecond >= 30) {
      const diff = state.instantPaceSecPerKm - state.config.target.paceSecPerKm;
      if (state.instantPaceSecPerKm > 0 && diff > 30) {
        nextState.lastAlertSecond = nextElapsed;
        nextState.pendingEvents = [
          ...state.pendingEvents,
          { type: "coach_alert", payload: { alert: "pace_too_slow", behind: Math.round(diff) } },
        ];
      } else if (state.instantPaceSecPerKm > 0 && diff < -30) {
        nextState.lastAlertSecond = nextElapsed;
        nextState.pendingEvents = [
          ...state.pendingEvents,
          { type: "coach_alert", payload: { alert: "pace_too_fast", ahead: Math.round(Math.abs(diff)) } },
        ];
      } else if (state.heartRateBpm && state.heartRateBpm > 185) {
        nextState.lastAlertSecond = nextElapsed;
        nextState.pendingEvents = [
          ...state.pendingEvents,
          { type: "coach_alert", payload: { alert: "hr_too_high", bpm: state.heartRateBpm } },
        ];
      }
    }

    set(nextState as Partial<RunStore>);
  },
  addRoutePoint: (point) => {
    const state = get();
    if (state.phase !== "active" && state.phase !== "warmup") {
      return;
    }

    const lastPoint = state.routePoints.length > 0 ? state.routePoints[state.routePoints.length - 1] : null;
    const nextPoint =
      lastPoint && point.accuracy <= 30
        ? {
            ...point,
            lat: lastPoint.lat * 0.3 + point.lat * 0.7,
            lng: lastPoint.lng * 0.3 + point.lng * 0.7,
            alt: lastPoint.alt * 0.3 + point.alt * 0.7,
          }
        : point;

    const routePoints = [...state.routePoints, nextPoint];
    const renderedRoutePoints = routePoints.slice(-500);
    const distanceMeters = calculateTotalDistance(routePoints);
    const instantPaceSecPerKm = rollingPace(routePoints);
    const avgPaceSecPerKm = distanceMeters > 0 ? (state.elapsedSeconds / distanceMeters) * 1000 : 0;
    const avgSpeedKmh = state.elapsedSeconds > 0 ? (distanceMeters / 1000 / (state.elapsedSeconds / 3600)) : 0;
    const maxSpeedKmh = Math.max(state.maxSpeedKmh, nextPoint.speed);

    let elevationGainM = state.elevationGainM;
    let elevationLossM = state.elevationLossM;
    if (lastPoint) {
      const diff = nextPoint.alt - lastPoint.alt;
      if (diff > 0.5) {
        elevationGainM += diff;
      } else if (diff < -0.5) {
        elevationLossM += Math.abs(diff);
      }
    }

    const kmDone = Math.floor(distanceMeters / 1000);
    const kmSplits = [...state.kmSplits];
    const kmMarkers = [...state.kmMarkers];
    while (kmSplits.length < kmDone) {
      const km = kmSplits.length + 1;
      const splitSeconds = currentKmSplitSeconds(state.elapsedSeconds, kmSplits);
      kmSplits.push({
        km,
        paceSec: splitSeconds,
        hr: state.heartRateBpm,
        elevation: Math.round(elevationGainM),
        timestamp: Date.now(),
      });
      kmMarkers.push({ km, point: nextPoint, timestamp: Date.now() });
    }

    const bestPaceSecPerKm = kmSplits.length > 0 ? Math.min(...kmSplits.map((split) => split.paceSec)) : 0;
    const totalSteps = state.totalSteps > 0 ? state.totalSteps : Math.round(distanceMeters / defaultStrideM);
    const avgStrideLengthM = totalSteps > 0 ? distanceMeters / totalSteps : defaultStrideM;
    const newEvents = [...state.pendingEvents];
    if (kmMarkers.length > state.kmMarkers.length) {
      const marker = kmMarkers[kmMarkers.length - 1];
      newEvents.push({ type: "km_milestone", payload: { km: marker.km } });
    }

    set({
      routePoints,
      renderedRoutePoints,
      distanceMeters,
      instantPaceSecPerKm,
      avgPaceSecPerKm,
      bestPaceSecPerKm,
      avgSpeedKmh,
      maxSpeedKmh,
      elevationGainM,
      elevationLossM,
      kmSplits,
      kmMarkers,
      totalSteps,
      avgStrideLengthM,
      pendingEvents: newEvents,
    });
  },
  setHeartRate: (bpm) => {
    const state = get();
    if (!bpm) {
      set({ heartRateBpm: null });
      return;
    }

    const maxHeartRateBpm = Math.max(state.maxHeartRateBpm ?? 0, bpm);
    const avgHeartRateBpm =
      state.avgHeartRateBpm === null
        ? bpm
        : Math.round((state.avgHeartRateBpm * Math.max(1, state.elapsedSeconds - 1) + bpm) / Math.max(1, state.elapsedSeconds));

    set({ heartRateBpm: bpm, maxHeartRateBpm, avgHeartRateBpm });
  },
  setSteps: (steps) => {
    const state = get();
    set({
      totalSteps: Math.max(0, steps),
      avgCadenceSpm: state.elapsedSeconds > 0 ? Math.round((steps / state.elapsedSeconds) * 60) : 0,
      avgStrideLengthM: steps > 0 ? state.distanceMeters / steps : defaultStrideM,
    });
  },
  setCoachMessage: (message) => set({ coachMessage: message }),
  pushEvent: (event) => set({ pendingEvents: [...get().pendingEvents, event] }),
  shiftEvent: () => {
    const state = get();
    if (state.pendingEvents.length === 0) {
      return null;
    }
    const [first, ...rest] = state.pendingEvents;
    set({ pendingEvents: rest });
    return first;
  },
  completeRun: () => {
    const state = get();
    const summary: RunSummarySnapshot = {
      distanceMeters: state.distanceMeters,
      durationSeconds: state.elapsedSeconds,
      avgPaceSecPerKm: state.avgPaceSecPerKm,
      bestPaceSecPerKm: state.bestPaceSecPerKm,
      caloriesBurned: state.caloriesBurned,
      totalSteps: state.totalSteps,
      avgHeartRateBpm: state.avgHeartRateBpm,
      elevationGainM: state.elevationGainM,
      kmSplits: state.kmSplits,
    };
    set({ phase: "completed", endedAt: new Date().toISOString() });
    return summary;
  },
  resetRun: () => set({ ...initialState }),
}));
