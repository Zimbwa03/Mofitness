import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import * as Location from "expo-location";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { CoachRecord } from "../../features/findCoach/shared/types";
import { applyCoachFilters } from "../../features/findCoach/shared/filters";
import { mofitnessDarkMapStyle } from "../../features/findCoach/shared/mapStyle";
import type { FindCoachStackParamList } from "../../navigation/types";
import coachNetworkService from "../../services/CoachNetworkService";
import { colors, theme, typography } from "../../theme";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";

type Props = NativeStackScreenProps<FindCoachStackParamList, "FindCoachHome">;

const defaultRegion: Region = {
  latitude: -17.8252,
  longitude: 31.0335,
  latitudeDelta: 0.18,
  longitudeDelta: 0.12,
};

export function FindCoachScreen({ navigation }: Props) {
  const [coaches, setCoaches] = useState<CoachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>(defaultRegion);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [permission, nextCoaches] = await Promise.all([
          Location.requestForegroundPermissionsAsync(),
          coachNetworkService.getApprovedCoaches(),
        ]);

        if (!mounted) {
          return;
        }

        setCoaches(nextCoaches);
        setSelectedCoachId(nextCoaches[0]?.id ?? null);

        if (permission.granted) {
          const current = await Location.getCurrentPositionAsync({});
          if (!mounted) {
            return;
          }

          setRegion((prev) => ({
            ...prev,
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          }));
        } else if (nextCoaches[0]?.lat && nextCoaches[0]?.lng) {
          setRegion((prev) => ({
            ...prev,
            latitude: Number(nextCoaches[0].lat),
            longitude: Number(nextCoaches[0].lng),
          }));
        }
      } catch {
        if (mounted) {
          setCoaches([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load().catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      applyCoachFilters(coaches, {
        search,
        sort: "nearest",
        userLat: region.latitude,
        userLng: region.longitude,
      }),
    [coaches, region.latitude, region.longitude, search],
  );

  const selectedCoach =
    filtered.find((entry) => entry.coach.id === selectedCoachId)?.coach ??
    filtered[0]?.coach ??
    null;

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.accent_green} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find A Coach</Text>
        <Text style={styles.subtitle}>Verified fitness professionals near you</Text>
      </View>

      <MoCard variant="highlight" style={styles.matchCard}>
        <Text style={styles.matchTitle}>Get matched to the right coach</Text>
        <Text style={styles.matchText}>
          Use the web matching flow for BMI-based recommendations, then continue the conversation here in the app.
        </Text>
        <MoButton
          size="medium"
          onPress={() => navigation.navigate("CoachProfile", { coachId: selectedCoach?.id ?? "" })}
        >
          View Selected Coach
        </MoButton>
      </MoCard>

      <Text style={styles.searchLabel}>Search</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <MoButton size="small" variant={search === "" ? "primary" : "ghost"} onPress={() => setSearch("")}>
          All
        </MoButton>
        <MoButton size="small" variant={search === "weight" ? "primary" : "ghost"} onPress={() => setSearch("weight")}>
          Weight Loss
        </MoButton>
        <MoButton size="small" variant={search === "muscle" ? "primary" : "ghost"} onPress={() => setSearch("muscle")}>
          Muscle Gain
        </MoButton>
        <MoButton size="small" variant={search === "virtual" ? "primary" : "ghost"} onPress={() => setSearch("virtual")}>
          Virtual
        </MoButton>
      </ScrollView>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        customMapStyle={mofitnessDarkMapStyle as never}
      >
        {filtered.map(({ coach }) =>
          coach.lat && coach.lng ? (
            <Marker
              key={coach.id}
              coordinate={{ latitude: Number(coach.lat), longitude: Number(coach.lng) }}
              pinColor={coach.id === selectedCoach?.id ? colors.accent_green : colors.accent_amber}
              onPress={() => setSelectedCoachId(coach.id)}
            />
          ) : null,
        )}
      </MapView>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filtered.map(({ coach, distanceKm }) => (
          <Pressable key={coach.id} onPress={() => setSelectedCoachId(coach.id)}>
            <MoCard variant={coach.id === selectedCoach?.id ? "highlight" : "default"} style={styles.coachCard}>
              <Text style={styles.coachName}>{coach.full_name}</Text>
              <Text style={styles.coachMeta}>
                {coach.city}, {coach.country} · {distanceKm ? `${distanceKm.toFixed(1)} km away` : "Near you"}
              </Text>
              <Text style={styles.coachMeta}>
                {(coach.specialisations ?? []).join(" · ")}
              </Text>
              <View style={styles.actions}>
                <MoButton size="small" onPress={() => navigation.navigate("CoachProfile", { coachId: coach.id })}>
                  View Profile
                </MoButton>
                <MoButton
                  size="small"
                  variant="ghost"
                  onPress={() => navigation.navigate("CoachChat", { coachId: coach.id })}
                >
                  Message Coach
                </MoButton>
              </View>
            </MoCard>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: colors.bg_primary,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  title: {
    ...typography.display_md,
    color: colors.text_primary,
  },
  subtitle: {
    ...typography.body_sm,
    color: colors.text_secondary,
    marginTop: theme.spacing.xs,
  },
  matchCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  matchTitle: {
    ...typography.body_lg,
    color: colors.text_primary,
    fontFamily: theme.typography.bold,
    marginBottom: theme.spacing.xs,
    textTransform: "uppercase",
  },
  matchText: {
    ...typography.body_sm,
    color: colors.text_secondary,
    marginBottom: theme.spacing.md,
  },
  searchLabel: {
    ...typography.label,
    color: colors.text_secondary,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  filterRow: {
    maxHeight: 48,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  map: {
    height: 240,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  list: {
    flex: 1,
    marginTop: theme.spacing.md,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  coachCard: {
    marginBottom: theme.spacing.md,
  },
  coachName: {
    ...typography.body_lg,
    fontFamily: theme.typography.bold,
    color: colors.text_primary,
    textTransform: "uppercase",
  },
  coachMeta: {
    ...typography.body_sm,
    color: colors.text_secondary,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
});
