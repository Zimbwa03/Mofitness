import { FlatList, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CoachMessageBubble } from "../../components/coach/CoachMessageBubble";
import { MoBadge } from "../../components/common/MoBadge";
import { MoCard } from "../../components/common/MoCard";
import { MoProgressBar } from "../../components/common/MoProgressBar";
import { useChallengeStore } from "../../stores/challengeStore";
import { colors, layout, theme, typography } from "../../theme";
import { getTabScreenBottomPadding } from "../../utils/screen";

export function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const challenges = useChallengeStore((state) => state.challenges);
  const podium = challenges.slice(0, 3);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getTabScreenBottomPadding(insets.bottom) }]}
      data={challenges}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Most Calories</Text>
          <CoachMessageBubble
            feature="Leaderboard"
            pose="chat"
            message="You climbed well. Keep pressure on and defend your position in the next session."
          />
          <View style={styles.liveRow}>
            <MoBadge>Updates Live</MoBadge>
          </View>
          <View style={styles.podiumRow}>
            {podium.map((item, index) => (
              <MoCard key={item.id} style={[styles.podiumCard, index === 0 && styles.podiumCenter]}>
                <Text style={styles.podiumRank}>#{index + 1}</Text>
                <Text style={styles.podiumName}>{item.title}</Text>
                <Text style={styles.podiumScore}>{item.progress_metric}</Text>
              </MoCard>
            ))}
          </View>
          <MoCard variant="highlight">
            <Text style={styles.youTitle}>You</Text>
            <Text style={styles.youMeta}>Rank #3 | 1,840 points</Text>
            <MoProgressBar style={styles.youProgress} value={0.68} />
          </MoCard>
        </>
      }
      renderItem={({ item }) => (
        <MoCard>
          <View style={styles.row}>
            <Text style={styles.rank}>{item.rank ?? "-"}</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowMeta}>{item.progress_metric} pts</Text>
              <MoProgressBar showLabel={false} value={Math.min(item.progress_metric / 2000, 1)} />
            </View>
          </View>
        </MoCard>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingBottom: theme.spacing.xxxl },
  title: { ...typography.display_md, marginBottom: theme.spacing.sm },
  liveRow: { marginBottom: theme.spacing.md },
  podiumRow: { flexDirection: "row", gap: theme.spacing.sm, alignItems: "flex-end", marginBottom: theme.spacing.md },
  podiumCard: { flex: 1, minHeight: 140, justifyContent: "center" },
  podiumCenter: { minHeight: 170 },
  podiumRank: { ...typography.display_md, color: colors.accent_green },
  podiumName: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.xs },
  podiumScore: { ...typography.body_xl, marginTop: theme.spacing.sm },
  youTitle: { ...typography.display_sm, marginBottom: theme.spacing.xs },
  youMeta: { ...typography.body_sm, color: colors.text_secondary },
  youProgress: { marginTop: theme.spacing.md },
  row: { flexDirection: "row", gap: theme.spacing.md },
  rank: { ...typography.display_sm, color: colors.accent_green, width: 28 },
  rowContent: { flex: 1 },
  rowTitle: { ...typography.body_xl, marginBottom: theme.spacing.xs },
  rowMeta: { ...typography.body_sm, color: colors.text_secondary, marginBottom: theme.spacing.sm },
});
