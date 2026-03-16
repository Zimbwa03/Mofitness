import { useEffect, useMemo, useRef, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCoachImage } from "../../assets/coaches";
import { CoachToast } from "../../components/coach/CoachToast";
import { MoButton } from "../../components/common/MoButton";
import { useWorkouts } from "../../hooks/useWorkouts";
import type { WorkoutsStackParamList } from "../../navigation/types";
import exerciseLibraryService from "../../services/ExerciseLibraryService";
import workoutService from "../../services/WorkoutService";
import { colors, layout, theme, typography } from "../../theme";
import { getScreenBottomPadding, getScreenTopPadding } from "../../utils/screen";
import { WorkoutAvatar } from "./components/WorkoutAvatar";

type Props = NativeStackScreenProps<WorkoutsStackParamList, "WorkoutPlayer">;

const REST_RING_SIZE = 160;
const REST_RING_STROKE = 12;
const REST_RING_RADIUS = (REST_RING_SIZE - REST_RING_STROKE) / 2;
const REST_CIRCUMFERENCE = 2 * Math.PI * REST_RING_RADIUS;

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function parseRepTarget(reps: string) {
  const match = reps.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getRestRingColor(secondsRemaining: number, totalSeconds: number) {
  if (secondsRemaining <= 5) {
    return colors.accent_red;
  }
  if (secondsRemaining <= 10) {
    return colors.accent_amber;
  }

  const ratio = totalSeconds <= 0 ? 1 : secondsRemaining / totalSeconds;
  return ratio <= 0.33 ? colors.accent_amber : colors.accent_green;
}

export function WorkoutPlayerScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const {
    allWorkouts,
    activeSession,
    currentExerciseIdx,
    currentSetIdx,
    sessionTimer,
    restTimer,
    isResting,
    isPaused,
    startSession,
    completeSet,
    startRest,
    skipRest,
    pauseSession,
    resumeSession,
    tickSession,
    endSession,
    nextExercise,
    prevExercise,
  } = useWorkouts();

  const [repCount, setRepCount] = useState(0);
  const [weightKg, setWeightKg] = useState(20);
  const [restSecondsControl, setRestSecondsControl] = useState(60);
  const [lastTapTs, setLastTapTs] = useState(0);
  const [coachToastMessage, setCoachToastMessage] = useState<string | null>(null);
  const lastRestDurationRef = useRef(60);
  const restCoachImage = useCoachImage("chat");

  const workout = useMemo(
    () => allWorkouts.find((item) => item.id === route.params.workoutId) ?? workoutService.getWorkoutById(route.params.workoutId),
    [allWorkouts, route.params.workoutId],
  );

  useEffect(() => {
    if (workout && (!activeSession || activeSession.workout.id !== workout.id)) {
      startSession(workout);
    }
  }, [activeSession, startSession, workout]);

  useEffect(() => {
    if (!activeSession) {
      return;
    }

    const timer = setInterval(() => {
      tickSession();
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession, tickSession]);

  useEffect(() => {
    const currentExercise = activeSession?.workout.exercises[currentExerciseIdx];
    if (!currentExercise) {
      return;
    }

    setRepCount(0);
    setRestSecondsControl(currentExercise.restSeconds);
    lastRestDurationRef.current = currentExercise.restSeconds;
    setCoachToastMessage(`Set up for ${currentExercise.exerciseName}. ${currentExercise.cue ?? "Move with control."}`);
  }, [activeSession?.workout.id, currentExerciseIdx]);

  useEffect(() => {
    if (!activeSession?.isCompleted) {
      return;
    }

    const summary = endSession();
    navigation.replace("WorkoutComplete", {
      workoutId: route.params.workoutId,
      title: route.params.title,
      durationSeconds: summary?.durationSeconds ?? 0,
      setsCompleted: summary?.setsCompleted ?? 0,
      calories: summary?.estimatedCalories ?? workout?.caloriesEstimate ?? 0,
      volumeKg: summary?.volumeKg ?? 0,
    });
  }, [activeSession?.isCompleted, endSession, navigation, route.params.title, route.params.workoutId, workout?.caloriesEstimate]);

  if (!workout || !activeSession) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Preparing workout...</Text>
      </View>
    );
  }

  const currentExercise = activeSession.workout.exercises[currentExerciseIdx];
  const nextExerciseItem = activeSession.workout.exercises[currentExerciseIdx + 1];

  if (!currentExercise) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Workout finished</Text>
      </View>
    );
  }

  const currentExerciseMeta = exerciseLibraryService.getExerciseById(currentExercise.exerciseId);

  const totalExercises = activeSession.workout.exercises.length;
  const targetReps = parseRepTarget(currentExercise.reps);
  const totalRest = Math.max(lastRestDurationRef.current, 1);
  const ringProgress = restTimer === null ? 0 : Math.max(0, Math.min(1, restTimer / totalRest));

  const handleRepTap = () => {
    const now = Date.now();
    const isDoubleTap = now - lastTapTs < 280;
    setLastTapTs(now);

    if (isDoubleTap) {
      setRepCount((value) => Math.max(0, value - 1));
      return;
    }

    setRepCount((value) => value + 1);
  };

  const handleLogSet = () => {
    const repsToLog = repCount > 0 ? repCount : targetReps;

    completeSet({
      repsCompleted: repsToLog,
      weightKg,
      restSeconds: restSecondsControl,
    });

    setCoachToastMessage(`Set logged. Recover ${restSecondsControl}s and get ready for the next effort.`);
    setRepCount(0);
  };

  const handleEndSession = () => {
    const summary = endSession();

    navigation.replace("WorkoutComplete", {
      workoutId: route.params.workoutId,
      title: route.params.title,
      durationSeconds: summary?.durationSeconds ?? sessionTimer,
      setsCompleted: summary?.setsCompleted ?? 0,
      calories: summary?.estimatedCalories ?? workout.caloriesEstimate,
      volumeKg: summary?.volumeKg ?? 0,
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: getScreenTopPadding(insets.top, theme.spacing.md),
            paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xl),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <MoButton onPress={handleEndSession} size="small" variant="ghost">
            End
          </MoButton>
          <View style={styles.topCenter}>
            <Text style={styles.exerciseCount}>
              {String(currentExerciseIdx + 1).padStart(2, "0")} / {String(totalExercises).padStart(2, "0")}
            </Text>
            <Text style={styles.setCount}>
              SET {currentSetIdx + 1} OF {currentExercise.sets}
            </Text>
          </View>
          <Pressable onPress={isPaused ? resumeSession : pauseSession}>
            <Text style={styles.sessionTimer}>{formatSeconds(sessionTimer)}</Text>
          </Pressable>
        </View>

        <View style={styles.avatarZone}>
          <WorkoutAvatar exercise={isResting ? "rest" : currentExercise.animationKey} isActive={!isPaused} size={280} />
          <Text style={styles.exerciseTitle}>{currentExercise.exerciseName.toUpperCase()}</Text>
          <Text style={styles.exerciseSubTitle}>
            Set {currentSetIdx + 1} of {currentExercise.sets} · {currentExercise.reps}
          </Text>
        </View>

        <View style={styles.cueCard}>
          <Text style={styles.cueText}>{currentExercise.cue ?? "Keep your core braced and maintain full range of motion."}</Text>
          {currentExerciseMeta ? <Text style={styles.cueMeta}>{currentExerciseMeta.anatomyFocus}</Text> : null}
          {currentExercise.stimulusNote ? <Text style={styles.cueMetaStrong}>{currentExercise.stimulusNote}</Text> : null}
          {currentExerciseMeta?.medicalConsiderations[0] ? (
            <Text style={styles.cueWarning}>Medical note: {currentExerciseMeta.medicalConsiderations[0]}</Text>
          ) : null}
          {currentExerciseMeta ? <Text style={styles.cueQuote}>"{currentExerciseMeta.motivationQuote}"</Text> : null}
          <View style={styles.cueActions}>
            <MoButton onPress={prevExercise} size="small" variant="secondary">
              Prev
            </MoButton>
            <MoButton onPress={nextExercise} size="small" variant="secondary">
              Next
            </MoButton>
          </View>
        </View>

        <View style={styles.loggerCard}>
          <Pressable onPress={handleRepTap} style={[styles.repButton, targetReps > 0 && repCount >= targetReps && styles.repButtonReady]}>
            <Text style={styles.repValue}>
              {repCount} / {targetReps > 0 ? targetReps : currentExercise.reps}
            </Text>
            <Text style={styles.repLabel}>REPS</Text>
          </Pressable>

          <View style={styles.adjustRow}>
            <View style={styles.adjustBlock}>
              <Text style={styles.adjustLabel}>WEIGHT</Text>
              <View style={styles.adjustControls}>
                <Pressable onPress={() => setWeightKg((value) => Math.max(0, value - 2.5))} style={styles.adjustBtn}>
                  <Text style={styles.adjustBtnText}>-</Text>
                </Pressable>
                <Text style={styles.adjustValue}>{weightKg.toFixed(1)} kg</Text>
                <Pressable onPress={() => setWeightKg((value) => value + 2.5)} style={styles.adjustBtn}>
                  <Text style={styles.adjustBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.adjustBlock}>
              <Text style={styles.adjustLabel}>REST</Text>
              <View style={styles.adjustControls}>
                <Pressable
                  onPress={() => {
                    const next = Math.max(15, restSecondsControl - 15);
                    setRestSecondsControl(next);
                    lastRestDurationRef.current = next;
                  }}
                  style={styles.adjustBtn}
                >
                  <Text style={styles.adjustBtnText}>-</Text>
                </Pressable>
                <Text style={styles.adjustValue}>{restSecondsControl}s</Text>
                <Pressable
                  onPress={() => {
                    const next = restSecondsControl + 15;
                    setRestSecondsControl(next);
                    lastRestDurationRef.current = next;
                  }}
                  style={styles.adjustBtn}
                >
                  <Text style={styles.adjustBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <MoButton onPress={handleLogSet}>Log This Set And Rest</MoButton>
        </View>

        <View style={styles.musicStub}>
          <Text style={styles.musicStubTitle}>Now playing: Workout Mix</Text>
          <Text style={styles.musicStubMeta}>Track controls connect in MusicService next slice</Text>
        </View>
      </ScrollView>
      <View style={styles.toastWrap}>
        <CoachToast
          visible={Boolean(coachToastMessage)}
          message={coachToastMessage ?? ""}
          onDismiss={() => setCoachToastMessage(null)}
          pose="chat"
          durationMs={3200}
        />
      </View>

      {isResting && restTimer !== null ? (
        <View style={styles.restOverlay}>
          <Text style={styles.restTitle}>REST</Text>

          <View style={styles.restRingWrap}>
            <Svg width={REST_RING_SIZE} height={REST_RING_SIZE} viewBox={`0 0 ${REST_RING_SIZE} ${REST_RING_SIZE}`}>
              <Circle
                cx={REST_RING_SIZE / 2}
                cy={REST_RING_SIZE / 2}
                r={REST_RING_RADIUS}
                stroke={colors.bg_surface}
                strokeWidth={REST_RING_STROKE}
                fill="none"
              />
              <Circle
                cx={REST_RING_SIZE / 2}
                cy={REST_RING_SIZE / 2}
                r={REST_RING_RADIUS}
                stroke={getRestRingColor(restTimer, totalRest)}
                strokeWidth={REST_RING_STROKE}
                fill="none"
                strokeDasharray={`${REST_CIRCUMFERENCE * ringProgress} ${REST_CIRCUMFERENCE}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${REST_RING_SIZE / 2} ${REST_RING_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.restRingCenter}>
              <Text style={styles.restTime}>{restTimer}</Text>
              <Text style={styles.restTimeLabel}>seconds</Text>
            </View>
          </View>

          {nextExerciseItem ? (
            <View style={styles.nextExerciseWrap}>
              <Text style={styles.nextLabel}>NEXT UP</Text>
              <Text style={styles.nextExerciseName}>{nextExerciseItem.exerciseName}</Text>
              <Text style={styles.nextExerciseMeta}>
                {nextExerciseItem.sets} sets × {nextExerciseItem.reps}
              </Text>
            </View>
          ) : null}
          <Image
            source={restCoachImage}
            style={styles.restCoachImage}
            accessibilityRole="image"
            accessibilityLabel="Coach chat pose during rest"
          />

          <View style={styles.restActions}>
            <MoButton onPress={skipRest} size="small" variant="ghost">
              Skip Rest
            </MoButton>
            <MoButton onPress={() => startRest((restTimer ?? 0) + 30)} size="small" variant="secondary">
              +30s
            </MoButton>
            <MoButton onPress={() => startRest(Math.max(5, (restTimer ?? 0) - 15))} size="small" variant="secondary">
              -15s
            </MoButton>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  content: {
    paddingHorizontal: layout.screen_padding_h,
    gap: theme.spacing.md,
  },
  fallback: {
    flex: 1,
    backgroundColor: colors.bg_primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackTitle: {
    ...typography.display_sm,
    color: colors.text_primary,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  topCenter: {
    alignItems: "center",
  },
  exerciseCount: {
    ...typography.body_lg,
    color: colors.text_primary,
  },
  setCount: {
    ...typography.caption,
    color: colors.text_secondary,
  },
  sessionTimer: {
    ...typography.body_lg,
    color: colors.accent_amber,
  },
  avatarZone: {
    minHeight: 280,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.lg,
    backgroundColor: colors.bg_surface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
  },
  exerciseTitle: {
    ...typography.display_md,
    color: colors.accent_green,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  exerciseSubTitle: {
    ...typography.body_sm,
    color: colors.accent_amber,
    marginTop: -2,
  },
  cueCard: {
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cueText: {
    ...typography.body_md,
    color: colors.text_primary,
  },
  cueMeta: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  cueMetaStrong: {
    ...typography.body_sm,
    color: colors.text_primary,
  },
  cueWarning: {
    ...typography.body_sm,
    color: colors.accent_amber,
  },
  cueQuote: {
    ...typography.body_sm,
    color: colors.accent_green,
  },
  cueActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  loggerCard: {
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_surface,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  repButton: {
    borderWidth: 1,
    borderColor: colors.border_strong,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg_elevated,
  },
  repButtonReady: {
    borderColor: colors.accent_green,
    shadowColor: colors.accent_green,
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  repValue: {
    ...typography.display_lg,
    color: colors.accent_green,
  },
  repLabel: {
    ...typography.label,
    color: colors.accent_amber,
    marginTop: -4,
  },
  adjustRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  adjustBlock: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_elevated,
    padding: theme.spacing.sm,
    gap: 6,
  },
  adjustLabel: {
    ...typography.label,
    color: colors.text_secondary,
  },
  adjustControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border_strong,
  },
  adjustBtnText: {
    ...typography.display_sm,
    color: colors.text_primary,
  },
  adjustValue: {
    ...typography.body_lg,
    color: colors.text_primary,
  },
  musicStub: {
    borderWidth: 1,
    borderColor: colors.border_subtle,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: colors.bg_surface,
  },
  musicStubTitle: {
    ...typography.body_lg,
    color: colors.text_primary,
  },
  musicStubMeta: {
    ...typography.caption,
    color: colors.text_secondary,
    marginTop: 2,
  },
  toastWrap: {
    position: "absolute",
    left: layout.screen_padding_h,
    right: layout.screen_padding_h,
    top: 84,
  },
  restOverlay: {
    position: "absolute",
    left: layout.screen_padding_h,
    right: layout.screen_padding_h,
    bottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: colors.border_strong,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(10,10,10,0.94)",
    padding: theme.spacing.md,
    alignItems: "center",
    gap: theme.spacing.md,
  },
  restTitle: {
    ...typography.display_lg,
    color: colors.accent_amber,
  },
  restRingWrap: {
    width: REST_RING_SIZE,
    height: REST_RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  restRingCenter: {
    position: "absolute",
    alignItems: "center",
  },
  restTime: {
    ...typography.display_md,
    color: colors.text_primary,
  },
  restTimeLabel: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  nextExerciseWrap: {
    alignItems: "center",
  },
  nextLabel: {
    ...typography.label,
    color: colors.accent_green,
  },
  nextExerciseName: {
    ...typography.body_xl,
    color: colors.text_primary,
    textAlign: "center",
  },
  nextExerciseMeta: {
    ...typography.body_sm,
    color: colors.accent_amber,
  },
  restCoachImage: {
    position: "absolute",
    right: 4,
    bottom: 56,
    height: 160,
    width: 96,
    resizeMode: "contain",
    opacity: 0.95,
  },
  restActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    width: "100%",
    justifyContent: "space-between",
  },
});
