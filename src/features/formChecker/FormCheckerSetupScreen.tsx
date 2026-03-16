import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Text } from "react-native-paper";

import { CoachMessageBubble } from "../../components/coach/CoachMessageBubble";
import { MoBadge } from "../../components/common/MoBadge";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { MoInput } from "../../components/common/MoInput";
import type { DashboardStackParamList } from "../../navigation/types";
import { colors, theme, typography } from "../../theme";
import { engineStatusCopy, sensitivityDescriptions, setupChecklist } from "./coaching/cueLibrary";
import { defaultExerciseConfig, exerciseRegistry } from "./exercises";
import { useFormCheckerStore } from "./stores/formCheckerStore";

type Props = NativeStackScreenProps<DashboardStackParamList, "FormCheckerSetup">;
type FilterKey = "all" | "strength" | "core" | "cardio";

export function FormCheckerSetupScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const consentAccepted = useFormCheckerStore((state) => state.consentAccepted);
  const config = useFormCheckerStore((state) => state.config);
  const acceptConsent = useFormCheckerStore((state) => state.acceptConsent);
  const updateConfig = useFormCheckerStore((state) => state.updateConfig);
  const selectedExercise = useMemo(() => exerciseRegistry.find((exercise) => exercise.id === config.exerciseId) ?? defaultExerciseConfig, [config.exerciseId]);

  const filteredExercises = useMemo(
    () =>
      exerciseRegistry.filter((exercise) => {
        const matchesFilter = filter === "all" ? true : exercise.category === filter;
        const matchesQuery =
          query.trim().length === 0 ||
          exercise.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          exercise.muscles.join(" ").toLowerCase().includes(query.trim().toLowerCase());
        return matchesFilter && matchesQuery;
      }),
    [filter, query],
  );

  const startSession = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        return;
      }
    }

    navigation.navigate("FormCheckerLive");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <MoCard variant="highlight">
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.section}>AI FORM CHECKER</Text>
            <Text style={styles.title}>Mo watches every rep.</Text>
            <Text style={styles.body}>Start from the dashboard card labeled Live Courch and configure the camera once.</Text>
          </View>
          <MoButton variant="ghost" size="small" onPress={() => navigation.navigate("FormCheckerHistory")}>
            History
          </MoButton>
        </View>
      </MoCard>
      <CoachMessageBubble
        feature="Form Checker"
        pose="squat"
        message="Set your camera so your full body stays visible. I will flag depth, alignment, and tempo in real time."
      />

      <MoCard variant={consentAccepted ? "glass" : "amber"}>
        <Text style={styles.section}>PRIVACY</Text>
        <Text style={styles.body}>Your camera feed stays on your device. Mo analyses movement patterns only. No video is recorded or uploaded.</Text>
        <MoButton variant={consentAccepted ? "secondary" : "primary"} size="medium" onPress={acceptConsent} style={styles.inlineButton}>
          {consentAccepted ? "Consent Saved" : "I Understand"}
        </MoButton>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>STEP 1 · SELECT EXERCISE</Text>
        <MoInput clearable label="Search exercise" onChangeText={setQuery} placeholder="Squat, push-up, deadlift..." value={query} />
        <View style={styles.filterRow}>
          {[
            { key: "all", label: "All" },
            { key: "strength", label: "Strength" },
            { key: "core", label: "Core" },
            { key: "cardio", label: "Cardio" },
          ].map((option) => (
            <MoButton
              key={option.key}
              size="small"
              style={styles.filterButton}
              variant={filter === option.key ? "primary" : "ghost"}
              onPress={() => setFilter(option.key as FilterKey)}
            >
              {option.label}
            </MoButton>
          ))}
        </View>

        <View style={styles.exerciseList}>
          {filteredExercises.map((exercise) => {
            const selected = exercise.id === selectedExercise.id;
            return (
              <Pressable key={exercise.id} onPress={() => updateConfig({ exerciseId: exercise.id })} style={[styles.exerciseRow, selected && styles.exerciseRowSelected]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                  <Text style={styles.exerciseMeta}>{exercise.muscles.join(" · ")}</Text>
                </View>
                <MoBadge variant={selected ? "amber" : "gray"}>{exercise.cameraPosition.replaceAll("_", " ")}</MoBadge>
              </Pressable>
            );
          })}
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>STEP 2 · CAMERA GUIDE</Text>
        <Text style={styles.titleSmall}>{selectedExercise.name}</Text>
        <Text style={styles.body}>{selectedExercise.description}</Text>
        <View style={styles.voiceRow}>
          <Text style={styles.body}>Camera side</Text>
          <View style={styles.cameraToggleRow}>
            <MoButton
              size="small"
              variant={config.cameraFacing === "front" ? "primary" : "ghost"}
              onPress={() => updateConfig({ cameraFacing: "front" })}
            >
              Front
            </MoButton>
            <MoButton
              size="small"
              variant={config.cameraFacing === "back" ? "primary" : "ghost"}
              onPress={() => updateConfig({ cameraFacing: "back" })}
            >
              Back
            </MoButton>
          </View>
        </View>
        <View style={styles.guideGrid}>
          <GuideStat label="Position" value={selectedExercise.cameraPosition.replaceAll("_", " ")} />
          <GuideStat label="Distance" value={`${selectedExercise.idealDistance[0]}-${selectedExercise.idealDistance[1]}m`} />
          <GuideStat label="Height" value={selectedExercise.cameraHeight} />
        </View>
        {selectedExercise.setupNotes.map((note) => (
          <Text key={note} style={styles.checkLine}>
            • {note}
          </Text>
        ))}
      </MoCard>

      <MoCard>
        <Text style={styles.section}>STEP 3 · CAMERA TEST</Text>
        {permission?.granted ? (
          <CameraView facing={config.cameraFacing} style={styles.preview} />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Text style={styles.previewText}>Camera preview locked until permission is granted.</Text>
            <MoButton size="medium" onPress={() => void requestPermission()} style={{ marginTop: theme.spacing.sm }}>
              Enable Camera
            </MoButton>
          </View>
        )}
        <Text style={styles.statusLine}>{permission?.granted ? `✓ ${engineStatusCopy.ready}` : "⚠ Grant camera access to validate framing."}</Text>
        {setupChecklist.map((item) => (
          <Text key={item} style={styles.checkLine}>
            • {item}
          </Text>
        ))}
      </MoCard>

      <MoCard>
        <Text style={styles.section}>STEP 4 · TARGETS</Text>
        <View style={styles.targetRow}>
          <ConfigStepper label="Sets" value={config.targetSets} values={[1, 2, 3, 4, 5]} onSelect={(value) => updateConfig({ targetSets: value })} />
          <ConfigStepper label="Reps" value={config.targetReps} values={[6, 8, 10, 12, 15]} onSelect={(value) => updateConfig({ targetReps: value })} />
          <ConfigStepper label="Rest" value={config.restSeconds} values={[45, 60, 90, 120]} suffix="s" onSelect={(value) => updateConfig({ restSeconds: value })} />
        </View>

        <View style={styles.voiceRow}>
          <Text style={styles.body}>Voice coaching</Text>
          <MoButton size="small" variant={config.voiceEnabled ? "primary" : "ghost"} onPress={() => updateConfig({ voiceEnabled: !config.voiceEnabled })}>
            {config.voiceEnabled ? "On" : "Off"}
          </MoButton>
        </View>
        <View style={styles.filterRow}>
          {(["low", "medium", "high"] as const).map((level) => (
            <MoButton
              key={level}
              size="small"
              style={styles.filterButton}
              variant={config.sensitivity === level ? "secondary" : "ghost"}
              onPress={() => updateConfig({ sensitivity: level })}
            >
              {level}
            </MoButton>
          ))}
        </View>
        <Text style={styles.bodyMuted}>{sensitivityDescriptions[config.sensitivity]}</Text>
      </MoCard>

      <MoButton disabled={!consentAccepted} onPress={() => void startSession()} style={{ marginBottom: theme.spacing.lg }}>
        Start Form Check
      </MoButton>
    </ScrollView>
  );
}

function GuideStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.guideCard}>
      <Text style={styles.guideValue}>{value}</Text>
      <Text style={styles.guideLabel}>{label}</Text>
    </View>
  );
}

function ConfigStepper({
  label,
  onSelect,
  suffix = "",
  value,
  values,
}: {
  label: string;
  onSelect: (value: number) => void;
  suffix?: string;
  value: number;
  values: number[];
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.guideLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        {values.map((item) => (
          <Pressable key={item} onPress={() => onSelect(item)} style={[styles.stepperChip, value === item && styles.stepperChipSelected]}>
            <Text style={[styles.stepperText, value === item && styles.stepperTextSelected]}>
              {item}
              {suffix}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { padding: theme.spacing.md, gap: theme.spacing.md },
  headerRow: { flexDirection: "row", gap: theme.spacing.md, alignItems: "flex-start" },
  section: { ...typography.label, color: colors.accent_green, marginBottom: theme.spacing.xs },
  title: { ...typography.display_sm, marginBottom: theme.spacing.xs },
  titleSmall: { ...typography.body_xl, marginBottom: theme.spacing.xs },
  body: { ...typography.body_md, color: colors.text_secondary },
  bodyMuted: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.sm },
  inlineButton: { marginTop: theme.spacing.md, alignSelf: "flex-start" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm, marginTop: theme.spacing.md },
  filterButton: { minWidth: 78 },
  exerciseList: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_elevated,
  },
  exerciseRowSelected: {
    borderColor: colors.accent_green,
    backgroundColor: "rgba(200,241,53,0.08)",
  },
  exerciseTitle: { ...typography.body_lg, color: colors.text_primary },
  exerciseMeta: { ...typography.body_sm, color: colors.text_secondary, marginTop: 2 },
  guideGrid: { flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.md },
  guideCard: {
    flex: 1,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  guideValue: { ...typography.body_lg, color: colors.text_primary, marginBottom: 4 },
  guideLabel: { ...typography.caption },
  preview: {
    height: 220,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    marginTop: theme.spacing.sm,
  },
  previewPlaceholder: {
    height: 220,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    paddingHorizontal: theme.spacing.lg,
  },
  previewText: { ...typography.body_md, color: colors.text_secondary, textAlign: "center" },
  statusLine: { ...typography.body_sm, color: colors.accent_green, marginTop: theme.spacing.md },
  checkLine: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.xs },
  targetRow: { gap: theme.spacing.md },
  stepper: { gap: theme.spacing.sm },
  stepperRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  stepperChip: {
    minWidth: 52,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    backgroundColor: colors.bg_elevated,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
  },
  stepperChipSelected: {
    borderColor: colors.accent_green,
    backgroundColor: "rgba(200,241,53,0.08)",
  },
  stepperText: { ...typography.body_sm, color: colors.text_secondary },
  stepperTextSelected: { color: colors.accent_green },
  voiceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing.md },
  cameraToggleRow: { flexDirection: "row", gap: theme.spacing.sm },
});
