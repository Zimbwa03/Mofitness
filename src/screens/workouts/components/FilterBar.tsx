import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { colors, theme, typography } from "../../../theme";

export interface FilterChip {
  id: string;
  label: string;
  active: boolean;
  onPress: () => void;
}

interface FilterBarProps {
  chips: FilterChip[];
  onOpenAdvanced?: () => void;
}

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function FilterBar({ chips, onOpenAdvanced }: FilterBarProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Chip active={false} label="Filters" onPress={onOpenAdvanced ?? (() => undefined)} />
        {chips.map((chip) => (
          <Chip key={chip.id} active={chip.active} label={chip.label} onPress={chip.onPress} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.sm,
  },
  scrollContent: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  chip: {
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: colors.border_strong,
    backgroundColor: colors.bg_surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.accent_green,
    borderColor: colors.accent_green,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    ...typography.label,
    color: colors.text_primary,
  },
  chipTextActive: {
    color: colors.text_inverse,
  },
});
