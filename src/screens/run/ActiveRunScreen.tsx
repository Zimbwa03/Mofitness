import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useKeepAwake } from "expo-keep-awake";
import * as Battery from "expo-battery";

import { CoachToast } from "../../components/coach/CoachToast";
import { useRun } from "../../hooks/useRun";
import type { DashboardStackParamList } from "../../navigation/types";
import gpsService from "../../services/GPSService";
import runCoachService from "../../services/ai/RunCoachService";
import stepCounterService from "../../services/StepCounterService";
import { colors, theme, typography } from "../../theme";
import { LiveMapView } from "./components/LiveMap/LiveMapView";
import { RunControls } from "./components/RunControls";
import { RunStatsPanel } from "./components/RunStatsPanel";
import { RunTimer } from "./components/RunTimer";
import { MoButton } from "../../components/common/MoButton";

type Props = NativeStackScreenProps<DashboardStackParamList, "ActiveRun">;

export function ActiveRunScreen({ navigation, route }: Props) {
  useKeepAwake();

  const {
    phase,
    config,
    elapsedSeconds,
    warmupRemainingSeconds,
    renderedRoutePoints,
    kmMarkers,
    distanceMeters,
    instantPaceSecPerKm,
    avgPaceSecPerKm,
    totalSteps,
    caloriesBurned,
    heartRateBpm,
    coachMessage,
    pendingEvents,
    startCountdown,
    startWarmup,
    startRun,
    pauseRun,
    resumeRun,
    tick,
    setSteps,
    setCoachMessage,
    shiftEvent,
    completeRun,
    resetRun,
  } = useRun();
  const [countdown, setCountdown] = useState(3);
  const [paceHistory, setPaceHistory] = useState<number[]>([]);
  const [distanceFlashKey, setDistanceFlashKey] = useState(0);
  const [fitToRouteSignal, setFitToRouteSignal] = useState(0);
  const trackingStarted = useRef(false);
  const lowBatteryHandled = useRef(false);
  const countdownScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    startCountdown();
    setCountdown(3);
  }, [startCountdown]);

  useEffect(() => {
    if (phase !== "countdown") {
      return;
    }
    const id = setInterval(() => {
      setCountdown((prev) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        Speech.speak(prev <= 1 ? "Go" : String(prev), { rate: 1.6, pitch: 1.1, language: "en" });
        countdownScale.setValue(0.7);
        Animated.spring(countdownScale, { toValue: 1.12, useNativeDriver: false, friction: 6 }).start(() => {
          Animated.timing(countdownScale, { toValue: 1, duration: 120, useNativeDriver: false }).start();
        });
        if (prev <= 1) {
          clearInterval(id);
          if (config?.warmupEnabled) {
            startWarmup(300);
          } else {
            startRun();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [config?.warmupEnabled, countdownScale, phase, startRun, startWarmup]);

  useEffect(() => {
    if (phase !== "active" && phase !== "warmup" && phase !== "paused") {
      return;
    }
    const id = setInterval(() => tick(), 1000);
    return () => clearInterval(id);
  }, [phase, tick]);

  useEffect(() => {
    if ((phase === "active" || phase === "warmup") && !trackingStarted.current) {
      trackingStarted.current = true;
      gpsService.startTracking().catch((error) => {
        console.warn("Failed to start GPS tracking", error);
      });
      stepCounterService.watchSteps((steps) => setSteps(steps));
    }
  }, [phase, setSteps]);

  useEffect(() => {
    if (phase === "paused" && trackingStarted.current) {
      gpsService.stopTracking().catch(() => undefined);
      trackingStarted.current = false;
      setCoachMessage("Paused. Recover your breath, then resume when ready.");
    }
  }, [phase, setCoachMessage]);

  useEffect(() => {
    if (phase === "completed" || phase === "idle") {
      gpsService.stopTracking().catch(() => undefined);
      stepCounterService.stopWatching();
      trackingStarted.current = false;
    }
  }, [phase]);

  useEffect(() => {
    if (!instantPaceSecPerKm) {
      return;
    }
    setPaceHistory((prev) => [...prev.slice(-29), instantPaceSecPerKm]);
  }, [instantPaceSecPerKm]);

  useEffect(() => {
    if (!coachMessage) {
      return;
    }
    const id = setTimeout(() => setCoachMessage(null), 6000);
    return () => clearTimeout(id);
  }, [coachMessage, setCoachMessage]);

  useEffect(() => {
    if (pendingEvents.length === 0) {
      return;
    }
    const event = shiftEvent();
    if (!event) {
      return;
    }

    if (event.type === "km_milestone") {
      const km = Number(event.payload.km ?? 0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
      setDistanceFlashKey((prev) => prev + 1);
      runCoachService
        .getKmMilestoneMessage({
          km,
          splitTime: elapsedSeconds,
          avgPace: avgPaceSecPerKm,
          targetPace: config?.target.paceSecPerKm ?? avgPaceSecPerKm,
          remainingDistance: Math.max(0, (config?.target.distanceMeters ?? distanceMeters) - distanceMeters),
          heartRate: heartRateBpm ?? 0,
        })
        .then((message) => {
          setCoachMessage(message);
          Speech.speak(message, { rate: 1.05, pitch: 1.0, language: "en" });
        })
        .catch(() => undefined);
      return;
    }

    const alert = String(event.payload.alert ?? "pace_too_slow") as "pace_too_slow" | "pace_too_fast" | "hr_too_high";
    runCoachService
      .getPaceAlertMessage(alert, {
        paceDiffSec: Number(event.payload.behind ?? event.payload.ahead ?? 0),
        bpm: Number(event.payload.bpm ?? 0),
        targetPace: config?.target.paceSecPerKm,
      })
      .then((message) => {
        setCoachMessage(message);
        Speech.speak(message, { rate: 1.0, pitch: 1.0, language: "en" });
      })
      .catch(() => undefined);
  }, [
    avgPaceSecPerKm,
    config?.target.distanceMeters,
    config?.target.paceSecPerKm,
    distanceMeters,
    elapsedSeconds,
    heartRateBpm,
    pendingEvents,
    setCoachMessage,
    shiftEvent,
  ]);

  const paceLabel = useMemo(() => {
    if (!instantPaceSecPerKm) {
      return "--:--";
    }
    const m = Math.floor(instantPaceSecPerKm / 60);
    const s = Math.round(instantPaceSecPerKm % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }, [instantPaceSecPerKm]);

  const coachPose = useMemo(() => {
    const text = (coachMessage ?? "").toLowerCase();
    if (text.includes("slow") || text.includes("high") || text.includes("alert") || text.includes("too")) {
      return "warning" as const;
    }
    return "sprint" as const;
  }, [coachMessage]);

  const elapsedLabel = useMemo(() => {
    const h = Math.floor(elapsedSeconds / 3600);
    const m = Math.floor((elapsedSeconds % 3600) / 60);
    const s = elapsedSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [elapsedSeconds]);

  const finish = async () => {
    setFitToRouteSignal((prev) => prev + 1);
    await new Promise((resolve) => setTimeout(resolve, 650));
    const summary = completeRun();
    await gpsService.stopTracking().catch(() => undefined);
    stepCounterService.stopWatching();

    navigation.replace("RunSummary", {
      summary,
      routePoints: renderedRoutePoints,
    });
  };

  const stopEarly = () => {
    Alert.alert("End run?", "Your current run will be saved.", [
      { text: "Cancel", style: "cancel" },
      { text: "End run", style: "destructive", onPress: () => void finish() },
    ]);
  };

  useEffect(() => {
    if (phase !== "active" && phase !== "warmup") {
      return;
    }
    const id = setInterval(() => {
      Battery.getBatteryLevelAsync()
        .then((level) => {
          if (level <= 0.05 && !lowBatteryHandled.current) {
            lowBatteryHandled.current = true;
            Alert.alert("Battery critically low", "Run tracking stopped to preserve your session.", [
              { text: "OK", onPress: () => void finish() },
            ]);
          }
        })
        .catch(() => undefined);
    }, 30000);

    return () => clearInterval(id);
  }, [phase]);

  useEffect(
    () => () => {
      gpsService.stopTracking().catch(() => undefined);
      stepCounterService.stopWatching();
      resetRun();
    },
    [resetRun],
  );

  if (phase === "countdown") {
    const countdownColor = countdown >= 3 ? "#E05252" : countdown === 2 ? "#F5A623" : "#C8F135";
    return (
      <View style={styles.countdown}>
        <Animated.View style={{ transform: [{ scale: countdownScale }] }}>
          <Text style={[styles.countdownText, { color: countdownColor }]}>{countdown === 0 ? "GO!" : countdown}</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <RunControls paused={phase === "paused"} onPause={pauseRun} onResume={resumeRun} onStop={stopEarly} />
      </View>
      <View style={styles.mapWrap}>
        <LiveMapView
          routePoints={renderedRoutePoints}
          plannedRoute={route.params?.plannedRoute ?? []}
          kmMarkers={kmMarkers}
          fitToRouteSignal={fitToRouteSignal}
        />
      </View>
      {phase === "paused" ? (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseTitle}>PAUSED</Text>
          <View style={styles.pauseButtons}>
            <MoButton onPress={resumeRun}>Resume Run</MoButton>
            <MoButton variant="secondary" onPress={() => setCoachMessage("Location saved for this pause point.")}>
              Save Location
            </MoButton>
            <MoButton variant="ghost" onPress={stopEarly}>
              End & Save Session
            </MoButton>
          </View>
        </View>
      ) : null}
      <View style={styles.coachWrap}>
        <CoachToast
          visible={Boolean(coachMessage)}
          message={coachMessage ?? ""}
          onDismiss={() => setCoachMessage(null)}
          pose={coachPose}
          durationMs={4000}
        />
      </View>
      <RunStatsPanel
        distanceKm={distanceMeters / 1000}
        paceLabel={paceLabel}
        elapsedLabel={elapsedLabel}
        bpm={heartRateBpm}
        steps={totalSteps}
        kcal={caloriesBurned}
        goalProgress={
          config?.target.distanceMeters
            ? Math.min(1, distanceMeters / config.target.distanceMeters)
            : config?.target.durationSeconds
              ? Math.min(1, elapsedSeconds / config.target.durationSeconds)
              : 0
        }
        paceHistory={paceHistory}
        flashKey={distanceFlashKey}
      />
      <View style={styles.timerBadge}>
        {phase === "warmup" ? (
          <Text style={styles.warmupLabel}>Warmup: {Math.ceil(warmupRemainingSeconds / 60)}m left</Text>
        ) : (
          <RunTimer seconds={elapsedSeconds} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  topRow: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md },
  mapWrap: { flex: 1, marginHorizontal: theme.spacing.md, marginTop: 6, marginBottom: 10 },
  coachWrap: { paddingHorizontal: theme.spacing.md, marginBottom: 8 },
  countdown: { flex: 1, backgroundColor: colors.bg_primary, alignItems: "center", justifyContent: "center" },
  countdownText: { ...typography.display_xl, color: colors.accent_green, fontSize: 120 },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  pauseTitle: { ...typography.display_lg, color: "#F5A623" },
  pauseButtons: { width: "100%", marginTop: theme.spacing.md, gap: theme.spacing.sm },
  timerBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "rgba(10,10,10,0.84)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  warmupLabel: { ...typography.body_sm, color: "#F5A623", fontWeight: "700" },
});
