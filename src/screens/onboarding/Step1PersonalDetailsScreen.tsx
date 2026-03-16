import { useMemo, useState } from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Text } from "react-native-paper";

import { CalendarIcon } from "../../components/icons";
import { MoInput } from "../../components/common/MoInput";
import type { Gender } from "../../models";
import type { OnboardingStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { colors, theme, typography } from "../../theme";
import { isEmail, isRequired } from "../../utils/validators";
import { OnboardingLayout } from "./OnboardingLayout";

const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Non-binary", value: "non_binary" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

type Props = NativeStackScreenProps<OnboardingStackParamList, "Step1PersonalDetails">;

export function Step1PersonalDetailsScreen({ navigation }: Props) {
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null);
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth ?? "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState("");

  const selectedGenderLabel = useMemo(
    () => genderOptions.find((option) => option.value === gender)?.label ?? "Select gender",
    [gender],
  );

  const formattedDate = useMemo(() => {
    if (!dateOfBirth) {
      return "Select your birth date";
    }

    const parsedDate = new Date(dateOfBirth);
    if (Number.isNaN(parsedDate.getTime())) {
      return dateOfBirth;
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [dateOfBirth]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setDateOfBirth(selectedDate.toISOString().slice(0, 10));
  };

  const handleNext = () => {
    if (!isRequired(fullName)) {
      setError("Full name is required.");
      return;
    }
    if (!isEmail(email)) {
      setError("A valid email address is required.");
      return;
    }

    setProfile({
      full_name: fullName.trim(),
      email: email.trim(),
      gender,
      date_of_birth: dateOfBirth.trim() || null,
    });
    navigation.navigate("Step2FitnessGoals");
  };

  return (
    <OnboardingLayout
      step={1}
      title="Let's get to know you"
      subtitle="We'll use this to personalize your experience."
      onNext={handleNext}
    >
      <MoInput label="Full Name" onChangeText={setFullName} testID="step1-full-name" value={fullName} />
      <MoInput autoCapitalize="none" label="Email" onChangeText={setEmail} testID="step1-email" value={email} />
      <View>
        <Text style={styles.sectionLabel}>Date of Birth</Text>
        <Pressable
          accessibilityLabel="Select date of birth"
          accessibilityRole="button"
          onPress={() => setShowDatePicker(true)}
          style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
          testID="step1-date-picker-trigger"
        >
          <View style={styles.dateContent}>
            <CalendarIcon color={dateOfBirth ? colors.accent_green : colors.text_secondary} size={18} />
            <Text style={[styles.dateText, !dateOfBirth && styles.datePlaceholder]}>{formattedDate}</Text>
          </View>
        </Pressable>
        <Text style={styles.helper}>Tap to open the calendar</Text>
        {showDatePicker ? (
          <DateTimePicker
            display="default"
            maximumDate={new Date()}
            mode="date"
            onChange={handleDateChange}
            value={dateOfBirth ? new Date(dateOfBirth) : new Date(2000, 0, 1)}
          />
        ) : null}
      </View>
      <View>
        <Text style={styles.sectionLabel}>Gender</Text>
        <View style={styles.optionGrid}>
          {genderOptions.map((option) => {
            const active = gender === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setGender(option.value)}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.helper}>{selectedGenderLabel}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    ...typography.label,
    marginBottom: theme.spacing.sm,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  dateField: {
    minHeight: 52,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  dateFieldPressed: {
    borderColor: colors.accent_green,
    opacity: 0.92,
  },
  dateContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    ...typography.body_md,
    color: colors.text_primary,
    marginLeft: theme.spacing.sm,
  },
  datePlaceholder: {
    color: colors.text_disabled,
  },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    backgroundColor: colors.bg_elevated,
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  pillActive: {
    backgroundColor: colors.accent_green,
    borderColor: colors.accent_green,
  },
  pillText: {
    ...typography.body_sm,
    color: colors.text_primary,
  },
  pillTextActive: {
    color: colors.text_inverse,
  },
  helper: {
    ...typography.caption,
    marginTop: theme.spacing.sm,
  },
  error: {
    ...typography.body_sm,
    color: colors.accent_red,
  },
});
