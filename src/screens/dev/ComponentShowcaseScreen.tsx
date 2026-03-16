import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { LightningIcon, MailIcon, SparkleIcon } from "../../components/icons";
import { MoBadge } from "../../components/common/MoBadge";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { MoInput } from "../../components/common/MoInput";
import { MoProgressBar } from "../../components/common/MoProgressBar";
import { MoSkeleton } from "../../components/common/MoSkeleton";
import { colors, layout, theme, typography } from "../../theme";

export function ComponentShowcaseScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Components</Text>

      <MoCard variant="highlight">
        <Text style={styles.label}>Buttons</Text>
        <View style={styles.row}>
          <MoButton icon={<LightningIcon color={colors.text_inverse} size={18} />}>Start Workout</MoButton>
          <MoButton variant="secondary">Secondary</MoButton>
        </View>
        <View style={styles.row}>
          <MoButton variant="ghost">Ghost</MoButton>
          <MoButton variant="amber">Amber</MoButton>
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.label}>Inputs and badges</Text>
        <MoInput label="Email" leftIcon={<MailIcon color={colors.text_secondary} size={18} />} placeholder="you@example.com" />
        <View style={styles.row}>
          <MoBadge>Green</MoBadge>
          <MoBadge variant="amber">Amber</MoBadge>
          <MoBadge variant="red">Red</MoBadge>
        </View>
      </MoCard>

      <MoCard variant="glass">
        <Text style={styles.label}>Progress and loading</Text>
        <View style={styles.row}>
          <SparkleIcon color={colors.accent_green} size={20} />
        </View>
        <MoProgressBar value={0.68} />
        <MoSkeleton height={16} style={{ marginTop: 16 }} width="100%" />
        <MoSkeleton height={96} style={{ marginTop: 12 }} width="100%" />
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  content: {
    paddingHorizontal: layout.screen_padding_h,
    paddingVertical: theme.spacing.lg,
  },
  heading: {
    ...typography.display_lg,
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...typography.label,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
    marginBottom: theme.spacing.md,
  },
});
