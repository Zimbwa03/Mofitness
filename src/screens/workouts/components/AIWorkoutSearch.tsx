import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Text } from "react-native-paper";

import { MoButton } from "../../../components/common/MoButton";
import { colors, theme, typography } from "../../../theme";

interface AIWorkoutSearchProps {
  visible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (query: string) => Promise<void> | void;
}

const QUICK_PROMPTS = [
  "Build muscle with dumbbells",
  "Burn fat in 20 minutes",
  "Low-impact workout for knee pain",
  "Core strength and posture",
  "No equipment hotel workout",
  "Stretch and recover after leg day",
  "Explosive sport performance",
  "Beginner strength foundation",
  "Heavy lifting lower body",
  "HIIT cardio without jumping",
];

export function AIWorkoutSearch({ visible, isLoading, onClose, onSubmit }: AIWorkoutSearchProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    await onSubmit(trimmed);
  };

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible} onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>TELL MO WHAT YOU NEED</Text>
            <Text style={styles.subtitle}>Describe your goal, limits, and time. Mo will build your session.</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>X</Text>
          </Pressable>
        </View>

        <View style={styles.inputWrap}>
          <TextInput
            multiline
            placeholder="e.g. Bigger legs, mild left-knee pain, 20 minutes max, no equipment, beginner"
            placeholderTextColor={colors.text_secondary}
            selectionColor={colors.accent_green}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <ScrollView contentContainerStyle={styles.chipsWrap}>
          {QUICK_PROMPTS.map((prompt) => (
            <Pressable key={prompt} onPress={() => setQuery(prompt)} style={styles.promptChip}>
              <Text style={styles.promptChipText}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <MoButton loading={isLoading} onPress={handleSubmit}>
            Find My Workout
          </MoButton>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg_primary,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    ...typography.display_sm,
    color: colors.accent_green,
  },
  subtitle: {
    ...typography.body_md,
    color: colors.text_secondary,
    marginTop: theme.spacing.xs,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border_strong,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    ...typography.label,
    color: colors.text_primary,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.border_strong,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    minHeight: 170,
    backgroundColor: colors.bg_surface,
    marginBottom: theme.spacing.md,
  },
  input: {
    ...typography.body_lg,
    color: colors.text_primary,
    textAlignVertical: "top",
    minHeight: 130,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  promptChip: {
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: colors.border_strong,
    backgroundColor: colors.bg_surface,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
  },
  promptChipText: {
    ...typography.body_sm,
    color: colors.text_primary,
  },
  footer: {
    marginTop: "auto",
    paddingTop: theme.spacing.md,
  },
});
