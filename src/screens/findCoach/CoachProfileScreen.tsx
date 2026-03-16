import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { CoachRecord } from "../../features/findCoach/shared/types";
import type { FindCoachStackParamList } from "../../navigation/types";
import coachNetworkService from "../../services/CoachNetworkService";
import { colors, theme, typography } from "../../theme";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";

type Props = NativeStackScreenProps<FindCoachStackParamList, "CoachProfile">;

export function CoachProfileScreen({ navigation, route }: Props) {
  const [coach, setCoach] = useState<CoachRecord | null>(null);

  useEffect(() => {
    coachNetworkService.getCoachById(route.params.coachId).then(setCoach).catch(() => undefined);
  }, [route.params.coachId]);

  if (!coach) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Loading coach...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MoCard variant="highlight">
        <Text style={styles.name}>{coach.full_name}</Text>
        <Text style={styles.meta}>
          {coach.city}, {coach.country} · ★ {Number(coach.avg_rating ?? 0).toFixed(1)}
        </Text>
        <Text style={styles.bio}>{coach.bio}</Text>
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>Specialisations</Text>
        <Text style={styles.meta}>{coach.specialisations.join(" · ")}</Text>
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>Session Types</Text>
        <Text style={styles.meta}>{coach.session_types.join(" · ")}</Text>
      </MoCard>

      <View style={styles.actions}>
        <MoButton onPress={() => navigation.navigate("CoachChat", { coachId: coach.id })}>
          Message This Coach
        </MoButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: colors.bg_primary,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.body_lg,
    color: colors.text_secondary,
  },
  name: {
    ...typography.display_md,
    color: colors.text_primary,
  },
  meta: {
    ...typography.body_sm,
    color: colors.text_secondary,
    marginTop: theme.spacing.xs,
  },
  bio: {
    ...typography.body_md,
    color: colors.text_primary,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    ...typography.body_lg,
    color: colors.text_primary,
    fontFamily: theme.typography.bold,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
  },
  actions: {
    marginTop: theme.spacing.md,
  },
});
