import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Battery from "expo-battery";

import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { useRun } from "../../hooks/useRun";
import type { RunConfig } from "../../models";
import type { DashboardStackParamList } from "../../navigation/types";
import { colors, theme, typography } from "../../theme";

type Props = NativeStackScreenProps<DashboardStackParamList, "RunSetup">;

export function RunSetupScreen({ route, navigation }: Props) {
  const { configureRun } = useRun();
  const initialActivity = route.params?.activityType ?? "outdoor_run";

  const [mode, setMode] = useState<RunConfig["target"]["mode"]>("distance");
  const [distanceKm, setDistanceKm] = useState(5);
  const [durationMin, setDurationMin] = useState(30);
  const [paceSec, setPaceSec] = useState(330);
  const [warmup, setWarmup] = useState(true);
  const [coach, setCoach] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    Battery.getBatteryLevelAsync()
      .then((level) => setBatteryLevel(level))
      .catch(() => setBatteryLevel(null));
  }, []);

  const targetSummary = useMemo(() => {
    if (mode === "distance") {
      return `${distanceKm} km target`;
    }
    if (mode === "time") {
      return `${durationMin} min target`;
    }
    return "Open run";
  }, [distanceKm, durationMin, mode]);

  const startRun = () => {
    configureRun({
      activityType: initialActivity,
      target: {
        mode,
        distanceMeters: mode === "distance" ? distanceKm * 1000 : undefined,
        durationSeconds: mode === "time" ? durationMin * 60 : undefined,
        paceSecPerKm: paceSec,
      },
      aiCoachingEnabled: coach,
      coachingFrequency: "every_km",
      warmupEnabled: warmup,
    });

    navigation.replace("ActiveRun", { plannedRoute: route.params?.plannedRoute ?? [] });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MoCard variant="highlight">
        <Text style={styles.section}>SET YOUR TARGET</Text>
        <View style={styles.row}>
          <MoButton variant={mode === "distance" ? "primary" : "ghost"} onPress={() => setMode("distance")}>
            Distance
          </MoButton>
          <MoButton variant={mode === "time" ? "primary" : "ghost"} onPress={() => setMode("time")}>
            Time
          </MoButton>
          <MoButton variant={mode === "open" ? "primary" : "ghost"} onPress={() => setMode("open")}>
            Open
          </MoButton>
        </View>
        <Text style={styles.body}>{targetSummary}</Text>
      </MoCard>

      {mode === "distance" ? (
        <MoCard>
          <Text style={styles.section}>DISTANCE</Text>
          <View style={styles.row}>
            {[1, 3, 5, 10, 21].map((chip) => (
              <MoButton key={chip} variant={distanceKm === chip ? "secondary" : "ghost"} onPress={() => setDistanceKm(chip)}>
                {`${chip}K`}
              </MoButton>
            ))}
          </View>
        </MoCard>
      ) : null}

      {mode === "time" ? (
        <MoCard>
          <Text style={styles.section}>TIME</Text>
          <View style={styles.row}>
            {[15, 30, 45, 60, 90].map((chip) => (
              <MoButton key={chip} variant={durationMin === chip ? "secondary" : "ghost"} onPress={() => setDurationMin(chip)}>
                {`${chip}m`}
              </MoButton>
            ))}
          </View>
        </MoCard>
      ) : null}

      <MoCard>
        <Text style={styles.section}>TARGET PACE</Text>
        <View style={styles.row}>
          {[300, 330, 360, 420].map((item) => (
            <MoButton key={item} variant={paceSec === item ? "secondary" : "ghost"} onPress={() => setPaceSec(item)}>
              {`${Math.floor(item / 60)}:${String(item % 60).padStart(2, "0")}/km`}
            </MoButton>
          ))}
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.section}>AI COACHING</Text>
        <View style={styles.row}>
          <MoButton variant={coach ? "primary" : "ghost"} onPress={() => setCoach((prev) => !prev)}>
            {coach ? "On" : "Off"}
          </MoButton>
          <MoButton variant={warmup ? "secondary" : "ghost"} onPress={() => setWarmup((prev) => !prev)}>
            {warmup ? "Warmup on" : "Warmup off"}
          </MoButton>
        </View>
      </MoCard>

      {route.params?.plannedRouteName ? (
        <MoCard variant="glass">
          <Text style={styles.section}>ROUTE SELECTED</Text>
          <Text style={styles.body}>{route.params.plannedRouteName}</Text>
        </MoCard>
      ) : null}

      {batteryLevel !== null && batteryLevel < 0.15 ? (
        <MoCard variant="amber">
          <Text style={styles.section}>BATTERY WARNING</Text>
          <Text style={styles.body}>Battery is low - your run may stop early. Charge before starting.</Text>
        </MoCard>
      ) : null}

      <MoButton onPress={startRun} style={{ marginBottom: theme.spacing.lg }}>
        Start Run
      </MoButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { padding: theme.spacing.md, gap: theme.spacing.md },
  section: { ...typography.label, color: colors.accent_green, marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  body: { ...typography.body_sm, color: colors.text_secondary, marginTop: 8 },
});
