import { useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Text } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import type { DashboardStackParamList } from "../../navigation/types";
import routeService from "../../services/RouteService";
import { colors, theme, typography } from "../../theme";
import { LiveMapView } from "./components/LiveMap/LiveMapView";

type Props = NativeStackScreenProps<DashboardStackParamList, "RouteDiscovery">;

export function RouteDiscoveryScreen({ navigation, route }: Props) {
  const [tab, setTab] = useState<"ai" | "map" | "saved">("ai");
  const [prompt, setPrompt] = useState("A flat 5km loop near a park that's safe at 6am");
  const [results, setResults] = useState<Awaited<ReturnType<typeof routeService.generateRoute>>[]>([]);

  const generate = async () => {
    const routeResult = await routeService.generateRoute(
      { lat: -17.8252, lng: 31.0335 },
      { distanceKm: 5, scenic: prompt.toLowerCase().includes("scenic"), easyAndFlat: true, loop: true, safeArea: true },
      "intermediate",
    );
    setResults([routeResult]);
  };

  const startRoute = (index = 0) => {
    navigation.navigate("RunSetup", {
      activityType: route.params?.activityType ?? "outdoor_run",
      plannedRoute: results[index]?.points ?? [],
      plannedRouteName: results[index]?.name ?? null,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.tabs}>
        <MoButton variant={tab === "ai" ? "primary" : "ghost"} onPress={() => setTab("ai")}>
          AI Suggest
        </MoButton>
        <MoButton variant={tab === "map" ? "primary" : "ghost"} onPress={() => setTab("map")}>
          Map Browse
        </MoButton>
        <MoButton variant={tab === "saved" ? "primary" : "ghost"} onPress={() => setTab("saved")}>
          Saved
        </MoButton>
      </View>

      {tab === "ai" ? (
        <MoCard>
          <Text style={styles.section}>TELL MO WHAT YOU NEED</Text>
          <TextInput style={styles.input} value={prompt} onChangeText={setPrompt} placeholderTextColor="#6D6D6D" />
          <MoButton onPress={() => void generate()} style={{ marginTop: 8 }}>
            Find Routes
          </MoButton>
        </MoCard>
      ) : null}

      {tab === "map" ? (
        <MoCard style={{ minHeight: 360 }}>
          <Text style={styles.section}>MAP BROWSE</Text>
          <View style={{ height: 300 }}>
            <LiveMapView routePoints={results[0]?.points ?? []} kmMarkers={[]} />
          </View>
        </MoCard>
      ) : null}

      {tab === "saved" ? (
        <MoCard>
          <Text style={styles.section}>SAVED ROUTES</Text>
          <Text style={styles.body}>Your saved routes will appear here.</Text>
        </MoCard>
      ) : null}

      {results.map((item, index) => (
        <MoCard key={`${item.name}-${index}`} variant="glass">
          <Text style={styles.routeTitle}>{item.name}</Text>
          <Text style={styles.body}>
            {(item.distanceMeters / 1000).toFixed(1)}km · {item.difficulty} · ~{item.estimatedMinutes} min
          </Text>
          <Text style={[styles.body, { marginTop: 6 }]}>{item.description}</Text>
          <View style={styles.row}>
            <MoButton variant="ghost" onPress={() => setTab("map")}>
              Preview
            </MoButton>
            <MoButton variant="secondary" onPress={() => startRoute(index)}>
              Run This
            </MoButton>
          </View>
        </MoCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { padding: theme.spacing.md, gap: theme.spacing.md },
  tabs: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  section: { ...typography.label, color: colors.accent_green, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    backgroundColor: "#0F0F0F",
    color: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  routeTitle: { ...typography.body_lg, color: "#FFF" },
  body: { ...typography.body_sm, color: colors.text_secondary },
  row: { flexDirection: "row", gap: 8, marginTop: 10 },
});
