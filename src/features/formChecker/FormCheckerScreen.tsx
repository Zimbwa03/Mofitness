import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { Dimensions, Image, Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useKeepAwake } from "expo-keep-awake";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "react-native-paper";

import { useCoachImage } from "../../assets/coaches";
import { MoButton } from "../../components/common/MoButton";
import { MoProgressBar } from "../../components/common/MoProgressBar";
import { useAuth } from "../../hooks/useAuth";
import type { DashboardStackParamList } from "../../navigation/types";
import { colors, theme, typography } from "../../theme";
import { engineStatusCopy } from "./coaching/cueLibrary";
import vertexFormCoach from "./coaching/VertexFormCoach";
import voiceCoach from "./coaching/VoiceCoach";
import { FormAnalyser } from "./engine/FormAnalyser";
import { PoseEngine } from "./engine/PoseEngine";
import { defaultExerciseConfig, exerciseLookup } from "./exercises";
import { POSE_LANDMARKS } from "./landmarks";
import { FormErrorBadge } from "./overlay/FormErrorBadge";
import { RepCounterOverlay } from "./overlay/RepCounter";
import { SkeletonOverlay } from "./overlay/SkeletonOverlay";
import { useFormCheckerStore } from "./stores/formCheckerStore";
import type {
  ActiveFormError,
  ErrorHistory,
  ExercisePhase,
  FormAnalysisResult,
  PoseEngineTelemetry,
  PoseFrame,
  FormSetSummary,
  FormSessionSummary,
  RepHistory,
} from "./types";

type Props = NativeStackScreenProps<DashboardStackParamList, "FormCheckerLive">;

type ErrorAccumulator = {
  id: string;
  cue: string;
  severity: ActiveFormError["severity"];
  count: number;
  totalDurationMs: number;
  fix: string;
  phaseHits: Record<ExercisePhase, number>;
};

const scoreColor = (score: number) => (score >= 85 ? colors.accent_green : score >= 65 ? colors.accent_amber : colors.error);
const badgeTargetIndex = {
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

const screen = Dimensions.get("window");
const formatThermalLabel = (thermalLevel?: PoseEngineTelemetry["thermalLevel"]) => {
  switch (thermalLevel) {
    case "nominal":
      return "Thermal nominal";
    case "fair":
      return "Thermal fair";
    case "moderate":
      return "Thermal moderate";
    case "serious":
      return "Thermal serious";
    case "critical":
      return "Thermal critical";
    case "shutdown":
      return "Thermal shutdown";
    default:
      return undefined;
  }
};

export function FormCheckerScreen({ navigation }: Props) {
  useKeepAwake();

  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [permission] = useCameraPermissions();
  const config = useFormCheckerStore((state) => state.config);
  const saveSession = useFormCheckerStore((state) => state.saveSession);
  const updateConfig = useFormCheckerStore((state) => state.updateConfig);
  const exercise = useMemo(() => exerciseLookup[config.exerciseId] ?? defaultExerciseConfig, [config.exerciseId]);
  const cornerCoachImage = useCoachImage(exercise.id === "squat" ? "squat" : "chat");
  const [landmarks, setLandmarks] = useState(() => Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0 })));
  const [analysis, setAnalysis] = useState<FormAnalysisResult>({
    errors: [],
    formScore: 100,
    sessionScore: 100,
    phase: "unknown",
    repCount: 0,
    primaryAngle: 0,
  });
  const [coachBubble, setCoachBubble] = useState("Position yourself so your full body is visible.");
  const [engineStatus, setEngineStatus] = useState<keyof typeof engineStatusCopy>("idle");
  const [engineTelemetry, setEngineTelemetry] = useState<PoseEngineTelemetry>({});
  const [paused, setPaused] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [currentSet, setCurrentSet] = useState(1);
  const analyserRef = useRef(new FormAnalyser(exercise));
  const repClockRef = useRef(Date.now());
  const setSummariesRef = useRef<FormSetSummary[]>([]);
  const repHistoryRef = useRef<RepHistory[]>([]);
  const scoreHistoryRef = useRef<number[]>([]);
  const repScoreHistoryRef = useRef<number[]>([]);
  const errorAccumulatorRef = useRef<Record<string, ErrorAccumulator>>({});
  const activeErrorsRef = useRef<Map<string, ActiveFormError>>(new Map());
  const previousRepCountRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowGuide(false), 4500);
    return () => clearTimeout(timer);
  }, [currentSet]);

  useEffect(() => {
    if (!coachBubble) {
      return;
    }
    const timer = setTimeout(() => setCoachBubble(""), 4000);
    return () => clearTimeout(timer);
  }, [coachBubble]);

  useEffect(
    () => () => {
      voiceCoach.reset();
    },
    [],
  );

  useEffect(() => {
    if (engineStatus === "tracking") {
      setShowGuide(false);
      return;
    }

    if (engineStatus === "no_pose") {
      setCoachBubble("Move back and keep your full body inside the frame.");
      return;
    }

    if (engineStatus === "unavailable") {
      setCoachBubble("Native pose tracking needs a development build with the local module installed.");
      return;
    }

    if (engineStatus === "error") {
      setCoachBubble("Tracking stopped unexpectedly. Pause and restart the set.");
    }
  }, [engineStatus]);

  const flushResolvedErrors = useEffectEvent((currentErrors: ActiveFormError[], phase: ExercisePhase) => {
    const currentIds = new Set(currentErrors.map((error) => error.id));

    for (const [id, previousError] of Array.from(activeErrorsRef.current.entries())) {
      if (currentIds.has(id)) {
        continue;
      }

      const bucket = errorAccumulatorRef.current[id] ?? {
        id,
        cue: previousError.cue,
        severity: previousError.severity,
        count: 0,
        totalDurationMs: 0,
        fix: previousError.fix,
        phaseHits: {
          up: 0,
          down: 0,
          top: 0,
          bottom: 0,
          unknown: 0,
        },
      };
      bucket.count += 1;
      bucket.totalDurationMs += previousError.duration;
      bucket.phaseHits[phase] += 1;
      errorAccumulatorRef.current[id] = bucket;
      activeErrorsRef.current.delete(id);
    }

    currentErrors.forEach((error) => {
      activeErrorsRef.current.set(error.id, error);
    });
  });

  const resetCurrentSetState = useEffectEvent(() => {
    const nextStart = Date.now();
    repClockRef.current = nextStart;
    analyserRef.current.reset();
    repHistoryRef.current = [];
    scoreHistoryRef.current = [];
    repScoreHistoryRef.current = [];
    errorAccumulatorRef.current = {};
    activeErrorsRef.current = new Map();
    previousRepCountRef.current = 0;
    setAnalysis({
      errors: [],
      formScore: 100,
      sessionScore: 100,
      phase: "unknown",
      repCount: 0,
      primaryAngle: 0,
    });
  });

  const buildErrorHistory = useEffectEvent((): ErrorHistory[] =>
    Object.values(errorAccumulatorRef.current)
      .map((item) => ({
        id: item.id,
        cue: item.cue,
        severity: item.severity,
        count: item.count,
        avgDurationMs: item.count > 0 ? Math.round(item.totalDurationMs / item.count) : 0,
        mostCommonPhase: (Object.entries(item.phaseHits).sort((a, b) => b[1] - a[1])[0]?.[0] as ExercisePhase) ?? "unknown",
        fix: item.fix,
      }))
      .sort((a, b) => {
        const severityRank = { critical: 3, warning: 2, info: 1 };
        if (severityRank[b.severity] !== severityRank[a.severity]) {
          return severityRank[b.severity] - severityRank[a.severity];
        }
        return b.count - a.count;
      }),
  );

  const finalizeSet = useEffectEvent((): FormSetSummary => {
    flushResolvedErrors([], analysis.phase);
    return {
      setNumber: currentSet,
      repTarget: config.targetReps,
      repCount: Math.max(previousRepCountRef.current, analysis.repCount),
      averageScore:
        repScoreHistoryRef.current.length > 0
          ? Math.round(repScoreHistoryRef.current.reduce((sum, value) => sum + value, 0) / repScoreHistoryRef.current.length)
          : analysis.sessionScore,
      repQuality: [...repScoreHistoryRef.current],
      repHistory: [...repHistoryRef.current],
      topErrors: buildErrorHistory(),
    };
  });

  const completeSession = useEffectEvent(async (includeCurrentSet: boolean) => {
    const pendingSets = [...setSummariesRef.current];

    if (includeCurrentSet && (analysis.repCount > 0 || repHistoryRef.current.length > 0)) {
      pendingSets.push(finalizeSet());
    }

    if (pendingSets.length === 0) {
      navigation.goBack();
      return;
    }

    const overallScore = Math.round(pendingSets.reduce((sum, setSummary) => sum + setSummary.averageScore, 0) / pendingSets.length);
    const allIssues = pendingSets.flatMap((setSummary) => setSummary.topErrors);
    const mergedIssues = Object.values(
      allIssues.reduce<Record<string, ErrorHistory>>((acc, issue) => {
        const existing = acc[issue.id];
        if (!existing) {
          acc[issue.id] = { ...issue };
          return acc;
        }
        existing.count += issue.count;
        existing.avgDurationMs = Math.round((existing.avgDurationMs + issue.avgDurationMs) / 2);
        return acc;
      }, {}),
    ).sort((a, b) => b.count - a.count);

    const summary: FormSessionSummary = {
      id: `session-${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      performedAt: new Date().toISOString(),
      overallScore,
      setsCompleted: pendingSets.length,
      targetSets: config.targetSets,
      targetReps: config.targetReps,
      setBreakdown: pendingSets,
      topIssues: mergedIssues,
      coach: null,
    };

    try {
      summary.coach = await vertexFormCoach.analyzeFormSession(
        exercise,
        pendingSets.flatMap((setSummary) => setSummary.repHistory),
        mergedIssues,
        overallScore,
        profile,
      );
    } catch {
      summary.coach = null;
    }

    saveSession(summary);
    navigation.replace("FormCheckerSummary");
  });

  const handleFrame = useEffectEvent((frame: PoseFrame) => {
    setLandmarks(frame.landmarks);
    setEngineTelemetry((current) => ({
      ...current,
      frameWidth: frame.frameWidth ?? current.frameWidth,
      frameHeight: frame.frameHeight ?? current.frameHeight,
      inferenceTimeMs: frame.inferenceTimeMs ?? current.inferenceTimeMs,
    }));
    const next = analyserRef.current.analyse(frame.landmarks);
    scoreHistoryRef.current.push(next.formScore);
    if (scoreHistoryRef.current.length > 120) {
      scoreHistoryRef.current.shift();
    }
    const sessionScore = Math.round(scoreHistoryRef.current.reduce((sum, value) => sum + value, 0) / scoreHistoryRef.current.length);
    const result = { ...next, sessionScore };
    setAnalysis(result);
    flushResolvedErrors(result.errors, result.phase);

    if (result.errors[0]) {
      setCoachBubble(result.errors[0].message);
      if (config.voiceEnabled) {
        voiceCoach.announceErrors(result.errors, config.sensitivity);
      }
    }

    if (result.repCount > previousRepCountRef.current) {
      const now = frame.timestamp;
      const repDuration = Math.max(900, now - repClockRef.current);
      const rep: RepHistory = {
        repNumber: result.repCount,
        formScore: result.formScore,
        primaryAngle: result.primaryAngle,
        eccentricMs: Math.round(repDuration * 0.56),
        concentricMs: Math.round(repDuration * 0.44),
        phase: result.phase,
      };
      repClockRef.current = now;
      previousRepCountRef.current = result.repCount;
      repHistoryRef.current.push(rep);
      repScoreHistoryRef.current.push(result.formScore);
      setCoachBubble(result.errors[0]?.fix ?? exercise.phaseCues.concentric);

      if (config.voiceEnabled) {
        voiceCoach.announceRep(result.repCount, result.formScore, config.targetReps);
      }
    }
  });

  const handleEngineStatus = useEffectEvent((status: keyof typeof engineStatusCopy, telemetry?: PoseEngineTelemetry) => {
    setEngineStatus(status);
    if (!telemetry) {
      return;
    }

    setEngineTelemetry((current) => ({
      ...current,
      ...telemetry,
    }));
  });

  const logCurrentSet = async () => {
    const setSummary = finalizeSet();
    setSummariesRef.current = [...setSummariesRef.current, setSummary];

    if (currentSet >= config.targetSets) {
      await completeSession(false);
      return;
    }

    setCurrentSet((value) => value + 1);
    setCoachBubble(`Set ${currentSet} saved. Rest ${config.restSeconds} seconds, then start set ${currentSet + 1}.`);
    setPaused(false);
    resetCurrentSetState();
  };

  const askMo = async () => {
    const message = analysis.errors[0]?.fix ?? exercise.phaseCues[analysis.phase === "down" ? "eccentric" : analysis.phase === "bottom" ? "bottom" : analysis.phase === "top" ? "top" : "concentric"];
    setCoachBubble(message);
    if (config.voiceEnabled) {
      await voiceCoach.speak(message, `ask_mo_${Date.now()}`, "info");
    }
  };

  const averageRepDuration =
    repHistoryRef.current.length > 0
      ? repHistoryRef.current.reduce((sum, rep) => sum + rep.eccentricMs + rep.concentricMs, 0) / repHistoryRef.current.length
      : 0;
  const trackerDiagnostics = [
    engineTelemetry.actualFps != null || engineTelemetry.targetFps != null
      ? `${engineTelemetry.actualFps ?? "--"}/${engineTelemetry.targetFps ?? "--"} FPS`
      : undefined,
    engineTelemetry.frameWidth && engineTelemetry.frameHeight ? `${engineTelemetry.frameWidth}x${engineTelemetry.frameHeight}` : undefined,
    engineTelemetry.inferenceTimeMs != null ? `${Math.round(engineTelemetry.inferenceTimeMs)}ms infer` : undefined,
    formatThermalLabel(engineTelemetry.thermalLevel),
    engineTelemetry.droppedFrames != null ? `${engineTelemetry.droppedFrames} dropped` : undefined,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {permission?.granted ? <PoseEngine cameraFacing={config.cameraFacing} exercise={exercise} onFrame={handleFrame} onStatusChange={handleEngineStatus} running={!paused} /> : <View style={StyleSheet.absoluteFill} />}
      <View style={styles.dim} />
      <SkeletonOverlay errors={analysis.errors} landmarks={landmarks} screenHeight={screen.height} screenWidth={screen.width} />
      <RepCounterOverlay formScore={analysis.formScore} phase={analysis.phase} repCount={analysis.repCount} />

      {analysis.errors.map((error) => {
        const index = badgeTargetIndex[error.joint as keyof typeof badgeTargetIndex];
        if (typeof index !== "number" || !landmarks[index]) {
          return null;
        }
        return <FormErrorBadge key={`${error.id}-${error.duration}`} error={error} x={landmarks[index].x * screen.width} y={landmarks[index].y * screen.height} />;
      })}

      <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing.sm }]}>
        <Pressable onPress={() => void completeSession(true)} style={styles.endButton}>
          <Text style={styles.endButtonText}>END</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.exerciseTitle}>{exercise.name.toUpperCase()}</Text>
          <Text style={styles.setMeta}>SET {currentSet} / {config.targetSets}</Text>
        </View>
        <View style={styles.topRightCluster}>
          <Pressable
            onPress={() => updateConfig({ cameraFacing: config.cameraFacing === "front" ? "back" : "front" })}
            style={styles.flipButton}
          >
            <Text style={styles.flipButtonText}>{config.cameraFacing === "front" ? "BACK" : "FRONT"}</Text>
          </Pressable>
          <View style={[styles.scorePill, { borderColor: scoreColor(analysis.sessionScore) }]}>
            <Text style={[styles.scoreValue, { color: scoreColor(analysis.sessionScore) }]}>{analysis.sessionScore}%</Text>
            <Text style={styles.scoreLabel}>FORM</Text>
          </View>
        </View>
      </View>
      <Image
        source={cornerCoachImage}
        style={[styles.cornerCoach, { top: insets.top + 66 }]}
        accessibilityRole="image"
        accessibilityLabel="Coach pose during active form check"
      />

      {coachBubble ? (
        <BlurView intensity={24} tint="dark" style={[styles.coachBubble, { bottom: 152 + insets.bottom }]}>
          <Text style={styles.coachLabel}>MO SAYS</Text>
          <Text style={styles.coachText}>{coachBubble}</Text>
        </BlurView>
      ) : null}

      {showGuide ? (
        <View style={styles.guideOverlay}>
          <View style={styles.guideBox} />
          <Text style={styles.guideText}>Position yourself so your full body is visible.</Text>
        </View>
      ) : null}

      <BlurView intensity={28} tint="dark" style={[styles.bottomControls, { paddingBottom: insets.bottom + theme.spacing.md }]}>
        <View style={styles.controlRow}>
          <MoButton size="medium" variant={paused ? "primary" : "secondary"} onPress={() => setPaused((value) => !value)} style={styles.controlButton}>
            {paused ? "Resume" : "Pause"}
          </MoButton>
          <MoButton size="medium" onPress={() => void logCurrentSet()} style={styles.controlButton}>
            Log Set
          </MoButton>
          <MoButton size="medium" variant="ghost" onPress={() => void askMo()} style={styles.controlButton}>
            Ask Mo
          </MoButton>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Form</Text>
          <Text style={styles.metricValue}>{analysis.sessionScore}%</Text>
        </View>
        <MoProgressBar style={{ marginBottom: theme.spacing.sm }} value={analysis.sessionScore / 100} />
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Rep speed</Text>
          <Text style={styles.metricValue}>{averageRepDuration > 0 && averageRepDuration < 1700 ? "Fast" : averageRepDuration > 2400 ? "Controlled" : "Medium"}</Text>
        </View>
        <Text style={styles.footerMeta}>{engineStatusCopy[engineStatus]} | {config.voiceEnabled ? "Voice on" : "Voice muted"}</Text>
        {trackerDiagnostics ? <Text style={styles.footerMeta}>{trackerDiagnostics}</Text> : null}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(6,6,6,0.42)" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  endButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: colors.border_strong,
    backgroundColor: "rgba(10,10,10,0.66)",
  },
  endButtonText: { ...typography.label, color: colors.text_primary },
  headerCenter: { alignItems: "center" },
  topRightCluster: { alignItems: "flex-end", gap: 8 },
  cornerCoach: {
    position: "absolute",
    right: theme.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accent_green,
  },
  flipButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: "rgba(10,10,10,0.62)",
  },
  flipButtonText: { ...typography.caption, color: colors.text_primary },
  exerciseTitle: { ...typography.body_lg, color: colors.text_primary },
  setMeta: { ...typography.caption, color: colors.text_secondary, marginTop: 2 },
  scorePill: {
    minWidth: 86,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "rgba(10,10,10,0.72)",
  },
  scoreValue: { ...typography.body_xl },
  scoreLabel: { ...typography.caption, color: colors.text_secondary, marginTop: -2 },
  coachBubble: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.xxl,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: "rgba(200,241,53,0.36)",
    padding: theme.spacing.md,
  },
  coachLabel: { ...typography.label, color: colors.accent_green, marginBottom: 6 },
  coachText: { ...typography.body_md, color: colors.text_primary },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  guideBox: {
    width: screen.width * 0.48,
    height: screen.height * 0.58,
    borderWidth: 2,
    borderColor: "rgba(200,241,53,0.5)",
    borderRadius: 40,
    backgroundColor: "rgba(200,241,53,0.03)",
  },
  guideText: {
    ...typography.body_md,
    color: colors.text_primary,
    marginTop: theme.spacing.md,
    backgroundColor: "rgba(10,10,10,0.62)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
  },
  bottomControls: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    bottom: 0,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  controlRow: { flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  controlButton: { flex: 1 },
  metricRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metricLabel: { ...typography.body_sm, color: colors.text_secondary },
  metricValue: { ...typography.body_sm, color: colors.text_primary },
  footerMeta: { ...typography.caption, color: colors.text_secondary },
});
