import { useRunStore } from "../stores/runStore";

export const useRun = () => {
  const phase = useRunStore((state) => state.phase);
  const config = useRunStore((state) => state.config);
  const startedAt = useRunStore((state) => state.startedAt);
  const endedAt = useRunStore((state) => state.endedAt);
  const elapsedSeconds = useRunStore((state) => state.elapsedSeconds);
  const warmupRemainingSeconds = useRunStore((state) => state.warmupRemainingSeconds);

  const routePoints = useRunStore((state) => state.routePoints);
  const renderedRoutePoints = useRunStore((state) => state.renderedRoutePoints);
  const kmSplits = useRunStore((state) => state.kmSplits);
  const kmMarkers = useRunStore((state) => state.kmMarkers);

  const distanceMeters = useRunStore((state) => state.distanceMeters);
  const elevationGainM = useRunStore((state) => state.elevationGainM);
  const elevationLossM = useRunStore((state) => state.elevationLossM);
  const instantPaceSecPerKm = useRunStore((state) => state.instantPaceSecPerKm);
  const avgPaceSecPerKm = useRunStore((state) => state.avgPaceSecPerKm);
  const bestPaceSecPerKm = useRunStore((state) => state.bestPaceSecPerKm);
  const avgSpeedKmh = useRunStore((state) => state.avgSpeedKmh);
  const maxSpeedKmh = useRunStore((state) => state.maxSpeedKmh);
  const totalSteps = useRunStore((state) => state.totalSteps);
  const avgCadenceSpm = useRunStore((state) => state.avgCadenceSpm);
  const avgStrideLengthM = useRunStore((state) => state.avgStrideLengthM);
  const caloriesBurned = useRunStore((state) => state.caloriesBurned);
  const heartRateBpm = useRunStore((state) => state.heartRateBpm);
  const avgHeartRateBpm = useRunStore((state) => state.avgHeartRateBpm);
  const maxHeartRateBpm = useRunStore((state) => state.maxHeartRateBpm);
  const coachMessage = useRunStore((state) => state.coachMessage);
  const pendingEvents = useRunStore((state) => state.pendingEvents);

  const configureRun = useRunStore((state) => state.configureRun);
  const startCountdown = useRunStore((state) => state.startCountdown);
  const startWarmup = useRunStore((state) => state.startWarmup);
  const startRun = useRunStore((state) => state.startRun);
  const pauseRun = useRunStore((state) => state.pauseRun);
  const resumeRun = useRunStore((state) => state.resumeRun);
  const tick = useRunStore((state) => state.tick);
  const addRoutePoint = useRunStore((state) => state.addRoutePoint);
  const setHeartRate = useRunStore((state) => state.setHeartRate);
  const setSteps = useRunStore((state) => state.setSteps);
  const setCoachMessage = useRunStore((state) => state.setCoachMessage);
  const shiftEvent = useRunStore((state) => state.shiftEvent);
  const completeRun = useRunStore((state) => state.completeRun);
  const resetRun = useRunStore((state) => state.resetRun);

  return {
    phase,
    config,
    startedAt,
    endedAt,
    elapsedSeconds,
    warmupRemainingSeconds,
    routePoints,
    renderedRoutePoints,
    kmSplits,
    kmMarkers,
    distanceMeters,
    elevationGainM,
    elevationLossM,
    instantPaceSecPerKm,
    avgPaceSecPerKm,
    bestPaceSecPerKm,
    avgSpeedKmh,
    maxSpeedKmh,
    totalSteps,
    avgCadenceSpm,
    avgStrideLengthM,
    caloriesBurned,
    heartRateBpm,
    avgHeartRateBpm,
    maxHeartRateBpm,
    coachMessage,
    pendingEvents,
    configureRun,
    startCountdown,
    startWarmup,
    startRun,
    pauseRun,
    resumeRun,
    tick,
    addRoutePoint,
    setHeartRate,
    setSteps,
    setCoachMessage,
    shiftEvent,
    completeRun,
    resetRun,
  };
};
