import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getCoachImage } from "../../assets/coaches";
import { MoBadge } from "../../components/common/MoBadge";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { MoInput } from "../../components/common/MoInput";
import { useAuth } from "../../hooks/useAuth";
import type { ActivityLevel, ExperienceLevel, Gender } from "../../models";
import notificationService from "../../services/NotificationService";
import supabaseService from "../../services/SupabaseService";
import { useCoachStore } from "../../stores/coachStore";
import { colors, layout, theme, typography } from "../../theme";
import { getScreenBottomPadding } from "../../utils/screen";

const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non_binary" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

const experienceOptions: Array<{ label: string; value: ExperienceLevel }> = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const activityOptions: Array<{ label: string; value: ActivityLevel }> = [
  { label: "Sedentary", value: "sedentary" },
  { label: "Lightly Active", value: "lightly_active" },
  { label: "Active", value: "active" },
  { label: "Highly Active", value: "highly_active" },
];

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, preferences, setProfile, setPreferences, logout } = useAuth();
  const selectedCoach = useCoachStore((state) => state.selectedCoach);
  const coachName = useCoachStore((state) => state.coachName);
  const setCoach = useCoachStore((state) => state.setCoach);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth ?? "");
  const [heightCm, setHeightCm] = useState(profile?.height_cm ? String(profile.height_cm) : "");
  const [weightKg, setWeightKg] = useState(profile?.weight_kg ? String(profile.weight_kg) : "");
  const [sportFocus, setSportFocus] = useState(preferences.sport_focus ?? "");
  const [goals, setGoals] = useState(profile?.goals.join(", ") ?? "");
  const [trainingDays, setTrainingDays] = useState(
    preferences.training_days_per_week ? String(preferences.training_days_per_week) : "",
  );
  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile?.experience_level ?? "beginner");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(profile?.activity_level ?? null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const initials = useMemo(
    () =>
      fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join(""),
    [fullName],
  );

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setDateOfBirth(profile?.date_of_birth ?? "");
    setHeightCm(profile?.height_cm ? String(profile.height_cm) : "");
    setWeightKg(profile?.weight_kg ? String(profile.weight_kg) : "");
    setGoals(profile?.goals.join(", ") ?? "");
    setGender(profile?.gender ?? null);
    setExperienceLevel(profile?.experience_level ?? "beginner");
    setActivityLevel(profile?.activity_level ?? null);
  }, [profile]);

  useEffect(() => {
    setSportFocus(preferences.sport_focus ?? "");
    setTrainingDays(preferences.training_days_per_week ? String(preferences.training_days_per_week) : "");
  }, [preferences]);

  const handleSave = async () => {
    if (!user || !profile) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const nextProfile = await supabaseService.upsertProfile({
        ...profile,
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth || null,
        height_cm: heightCm ? Number(heightCm) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        gender,
        experience_level: experienceLevel,
        activity_level: activityLevel,
        goals: goals
          .split(",")
          .map((goal) => goal.trim())
          .filter(Boolean),
      });

      const nextPreferences = await supabaseService.upsertPreferences(user.id, {
        ...preferences,
        sport_focus: sportFocus.trim(),
        training_days_per_week: trainingDays ? Number(trainingDays) : null,
      });

      setProfile(nextProfile);
      setPreferences(nextPreferences);
      setMessage("Account preferences saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save account preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={colors.grad_hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials || "MF"}</Text>
          </View>
          <Image
            source={getCoachImage(selectedCoach, "standing")}
            style={styles.coachHero}
            accessibilityRole="image"
            accessibilityLabel={`${coachName} standing coach pose`}
          />
        </View>
        <Text style={styles.name}>{fullName || "Account Preferences"}</Text>
        <Text style={styles.handle}>{profile?.email ?? "mofitness account"}</Text>
        <MoBadge variant="amber">{`${profile?.points ?? 0} PTS`}</MoBadge>
        <Text style={styles.coachedBy}>{`Coached by ${coachName}`}</Text>
      </LinearGradient>

      <MoCard>
        <Text style={styles.sectionTitle}>Personalized account data</Text>
        <Text style={styles.sectionBody}>
          Update the information you entered during onboarding so training, nutrition, and recovery plans stay relevant.
        </Text>
        <View style={styles.formStack}>
          <MoInput label="Full Name" onChangeText={setFullName} value={fullName} />
          <MoInput
            autoCapitalize="none"
            editable={false}
            label="Email"
            value={profile?.email ?? ""}
          />
          <MoInput
            label="Date of Birth"
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
          />
          <View style={styles.metricRow}>
            <MoInput keyboardType="numeric" label="Height (cm)" onChangeText={setHeightCm} style={styles.metricInput} value={heightCm} />
            <MoInput keyboardType="numeric" label="Weight (kg)" onChangeText={setWeightKg} style={styles.metricInput} value={weightKg} />
          </View>
          <MoInput
            keyboardType="numeric"
            label="Training Days Per Week"
            onChangeText={setTrainingDays}
            value={trainingDays}
          />
          <MoInput label="Sport Focus" onChangeText={setSportFocus} value={sportFocus} />
          <MoInput
            label="Goals"
            onChangeText={setGoals}
            placeholder="weight loss, strength, endurance"
            value={goals}
          />
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>Training profile</Text>
        <Text style={styles.optionLabel}>Change Coach</Text>
        <View style={styles.optionWrap}>
          <Pressable
            onPress={() => {
              setCoach("male");
              if (profile?.notifications_enabled) {
                notificationService.syncDefaultReminders(true).catch(() => undefined);
              }
            }}
            style={[styles.optionChip, selectedCoach === "male" && styles.optionChipActive]}
          >
            <Text style={[styles.optionChipText, selectedCoach === "male" && styles.optionChipTextActive]}>Mo</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setCoach("female");
              if (profile?.notifications_enabled) {
                notificationService.syncDefaultReminders(true).catch(() => undefined);
              }
            }}
            style={[styles.optionChip, selectedCoach === "female" && styles.optionChipActive]}
          >
            <Text style={[styles.optionChipText, selectedCoach === "female" && styles.optionChipTextActive]}>Nia</Text>
          </Pressable>
        </View>
        <Text style={styles.optionLabel}>Gender</Text>
        <View style={styles.optionWrap}>
          {genderOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setGender(option.value)}
              style={[styles.optionChip, gender === option.value && styles.optionChipActive]}
            >
              <Text style={[styles.optionChipText, gender === option.value && styles.optionChipTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.optionLabel}>Experience Level</Text>
        <View style={styles.optionWrap}>
          {experienceOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setExperienceLevel(option.value)}
              style={[styles.optionChip, experienceLevel === option.value && styles.optionChipActive]}
            >
              <Text style={[styles.optionChipText, experienceLevel === option.value && styles.optionChipTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.optionLabel}>Activity Level</Text>
        <View style={styles.optionWrap}>
          {activityOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setActivityLevel(option.value)}
              style={[styles.optionChip, activityLevel === option.value && styles.optionChipActive]}
            >
              <Text style={[styles.optionChipText, activityLevel === option.value && styles.optionChipTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.buttonStack}>
          <MoButton loading={saving} onPress={handleSave}>
            Save Changes
          </MoButton>
          <MoButton onPress={() => void logout()} variant="danger">
            Sign Out
          </MoButton>
        </View>
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingBottom: theme.spacing.xxxl },
  hero: { borderRadius: theme.radius.lg, padding: theme.spacing.lg, alignItems: "center", marginBottom: theme.spacing.lg },
  heroTopRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.bg_elevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: colors.border_strong,
  },
  avatarInitials: { ...typography.display_sm, color: colors.accent_green },
  coachHero: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  name: { ...typography.display_sm, marginBottom: theme.spacing.xs, textAlign: "center" },
  handle: { ...typography.body_sm, color: colors.text_secondary, marginBottom: theme.spacing.md, textAlign: "center" },
  coachedBy: { ...typography.caption, color: colors.accent_green, marginTop: theme.spacing.sm },
  sectionTitle: { ...typography.display_sm, marginBottom: theme.spacing.sm },
  sectionBody: { ...typography.body_md, color: colors.text_secondary, marginBottom: theme.spacing.md },
  formStack: { gap: theme.spacing.md },
  metricRow: { flexDirection: "row", gap: theme.spacing.sm },
  metricInput: { flex: 1 },
  optionLabel: { ...typography.label, color: colors.text_secondary, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  optionWrap: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  optionChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  optionChipActive: {
    backgroundColor: colors.accent_green,
    borderColor: colors.accent_green,
  },
  optionChipText: {
    ...typography.body_sm,
    color: colors.text_primary,
  },
  optionChipTextActive: {
    color: colors.text_inverse,
  },
  message: {
    ...typography.body_sm,
    color: colors.accent_amber,
    marginTop: theme.spacing.md,
  },
  buttonStack: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
});
