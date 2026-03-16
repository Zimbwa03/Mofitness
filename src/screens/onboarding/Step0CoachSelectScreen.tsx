import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { getCoachImage } from "../../assets/coaches";
import { MoButton } from "../../components/common/MoButton";
import type { OnboardingStackParamList } from "../../navigation/types";
import { useCoachStore } from "../../stores/coachStore";
import { colors, layout, theme, typography } from "../../theme";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Step0CoachSelect">;

export function Step0CoachSelectScreen({ navigation }: Props) {
  const selectedCoach = useCoachStore((state) => state.selectedCoach);
  const coachName = useCoachStore((state) => state.coachName);
  const setCoach = useCoachStore((state) => state.setCoach);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Coach</Text>
        <Text style={styles.subtitle}>They will guide your entire journey.</Text>
      </View>

      <View style={styles.cardsRow}>
        <Pressable
          onPress={() => setCoach("male")}
          style={[styles.card, selectedCoach === "male" ? styles.cardSelected : styles.cardUnselected]}
        >
          <View style={styles.glow} />
          <Image source={getCoachImage("male", "standing")} style={styles.coachImage} accessibilityRole="image" accessibilityLabel="Mo standing coach pose" />
          <View style={styles.cardFooter}>
            <Text style={styles.coachLabel}>MO</Text>
            <Text style={styles.roleLabel}>Your AI Coach</Text>
            <Text style={styles.selector}>{selectedCoach === "male" ? "Selected Mo" : "Select Mo"}</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => setCoach("female")}
          style={[styles.card, selectedCoach === "female" ? styles.cardSelected : styles.cardUnselected]}
        >
          <View style={styles.glow} />
          <Image source={getCoachImage("female", "standing")} style={styles.coachImage} accessibilityRole="image" accessibilityLabel="Nia standing coach pose" />
          <View style={styles.cardFooter}>
            <Text style={styles.coachLabel}>NIA</Text>
            <Text style={styles.roleLabel}>Your AI Coach</Text>
            <Text style={styles.selector}>{selectedCoach === "female" ? "Selected Nia" : "Select Nia"}</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.bottomText}>{`${coachName} will guide your journey`}</Text>
        <MoButton onPress={() => navigation.navigate("Step1PersonalDetails")}>{`Continue with ${coachName}`}</MoButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg_primary,
    paddingHorizontal: layout.screen_padding_h,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  title: {
    ...typography.display_md,
    textTransform: "uppercase",
  },
  subtitle: {
    ...typography.body_md,
    color: colors.text_secondary,
  },
  cardsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  card: {
    flex: 1,
    height: 400,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    overflow: "hidden",
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.accent_green,
    transform: [{ scale: 1.02 }],
  },
  cardUnselected: {
    opacity: 0.58,
  },
  glow: {
    position: "absolute",
    top: 40,
    left: "20%",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(200,241,53,0.08)",
  },
  coachImage: {
    width: "100%",
    height: "80%",
    resizeMode: "contain",
    marginTop: -8,
  },
  cardFooter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    gap: 2,
  },
  coachLabel: {
    ...typography.display_sm,
    color: colors.accent_green,
  },
  roleLabel: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  selector: {
    ...typography.label,
    color: colors.text_primary,
  },
  bottom: {
    marginTop: "auto",
    gap: theme.spacing.md,
  },
  bottomText: {
    ...typography.body_lg,
    color: colors.text_primary,
    textAlign: "center",
  },
});

