import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CoachFullPanel } from "../../components/coach/CoachFullPanel";
import { CoachMessageBubble } from "../../components/coach/CoachMessageBubble";
import { SimpleBarChart } from "../../components/charts/SimpleBarChart";
import { SimpleLineChart } from "../../components/charts/SimpleLineChart";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { InjuryRiskBanner } from "../../components/wellness/InjuryRiskBanner";
import { WellnessForm } from "../../components/wellness/WellnessForm";
import { useWellness } from "../../hooks/useWellness";
import { colors, layout, theme, typography } from "../../theme";
import { getTabScreenBottomPadding } from "../../utils/screen";

export function WellnessScreen() {
  const insets = useSafeAreaInsets();
  const { snapshot, setSnapshot } = useWellness();
  const [injuryRisk, setInjuryRisk] = useState(false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getTabScreenBottomPadding(insets.bottom) }]}
      showsVerticalScrollIndicator={false}
    >
      <MoCard variant="highlight">
        <Text style={styles.kicker}>Log today</Text>
        <Text style={styles.heading}>Mind and body status</Text>
        <Text style={styles.subheading}>Track sleep, hydration, stress, and mood in one pass.</Text>
        <WellnessForm
          initialValue={snapshot}
          onSubmit={(value) => {
            setSnapshot(value);
            setInjuryRisk((value.stress_level ?? 0) >= 8 && (value.sleep_hours ?? 8) < 6);
          }}
        />
      </MoCard>
      <CoachMessageBubble
        feature="Wellness"
        pose={injuryRisk ? "warning" : "chat"}
        message={
          injuryRisk
            ? "I need you to hear this: your recovery markers are stressed. Pull intensity down and prioritize sleep tonight."
            : "Great check-in. I will use this to tune your workload and recovery targets."
        }
      />

      <InjuryRiskBanner visible={injuryRisk} />
      {injuryRisk ? (
        <CoachFullPanel
          feature="Wellness Alert"
          pose="warning"
          message="Your stress is high while sleep is low. Reduce training load today and focus on hydration plus recovery."
        />
      ) : null}

      <MoCard>
        <Text style={styles.kicker}>7-day trends</Text>
        <Text style={styles.chartTitle}>Sleep trend</Text>
        <SimpleLineChart
          data={[
            { x: "Mon", y: 7 },
            { x: "Tue", y: 6.5 },
            { x: "Wed", y: 8 },
            { x: "Thu", y: 5.5 },
            { x: "Fri", y: 7.2 },
          ]}
        />
      </MoCard>

      <MoCard variant="glass">
        <Text style={styles.chartTitle}>Weekly load</Text>
        <SimpleBarChart
          data={[
            { x: "Mon", y: 320 },
            { x: "Tue", y: 460 },
            { x: "Wed", y: 280 },
            { x: "Thu", y: 510 },
            { x: "Fri", y: 390 },
          ]}
        />
        <Text style={styles.supporting}>Recovery charts are wired and ready for real data feeds.</Text>
      </MoCard>

      <MoCard>
        <Text style={styles.kicker}>AI wellness tips</Text>
        {[
          "Hydrate earlier in the day so your evening recovery is stronger.",
          "Shift one intense session to mobility if your sleep drops below 6 hours.",
          "Use a 10-minute breathing block after training to reduce stress carryover.",
        ].map((tip) => (
          <View key={tip} style={styles.tipRow}>
            <View style={styles.tipIcon} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
        <MoButton variant="secondary">View Recovery Plan</MoButton>
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingBottom: theme.spacing.xxxl },
  kicker: { ...typography.label, color: colors.accent_green, marginBottom: theme.spacing.sm },
  heading: { ...typography.display_sm, marginBottom: theme.spacing.xs },
  subheading: { ...typography.body_md, color: colors.text_secondary, marginBottom: theme.spacing.md },
  chartTitle: { ...typography.body_xl, marginBottom: theme.spacing.sm },
  supporting: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.sm },
  tipRow: { flexDirection: "row", gap: theme.spacing.sm, alignItems: "flex-start", marginBottom: theme.spacing.md },
  tipIcon: { width: 10, height: 10, borderRadius: 5, marginTop: 6, backgroundColor: colors.accent_green },
  tipText: { ...typography.body_md, flex: 1, color: colors.text_secondary },
});
