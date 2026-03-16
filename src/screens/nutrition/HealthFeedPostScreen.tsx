import { useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoButton } from '../../components/common/MoButton';
import { MoCard } from '../../components/common/MoCard';
import { MoInput } from '../../components/common/MoInput';
import { useAuth } from '../../hooks/useAuth';
import type { NutritionStackParamList } from '../../navigation/types';
import healthFeedService from '../../services/HealthFeedService';
import { useNutritionStore } from '../../stores/nutritionStore';
import { colors, layout, theme, typography } from '../../theme';
import { formatGoalType, formatMealSlot } from '../../utils/nutrition';
import { getScreenBottomPadding } from '../../utils/screen';
import { AccuracyScoreBadge } from './components/AccuracyScoreBadge';

type Props = NativeStackScreenProps<NutritionStackParamList, 'HealthFeedPost'>;

export function HealthFeedPostScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const mealLogs = useNutritionStore((state) => state.mealLogs);
  const activeGoal = useNutritionStore((state) => state.activeGoal);
  const upsertFeedPost = useNutritionStore((state) => state.upsertFeedPost);
  const mealLog = mealLogs.find((row) => row.id === route.params.mealLogId) ?? null;
  const [caption, setCaption] = useState('');
  const [audience, setAudience] = useState<'everyone' | 'fitness_community' | 'following'>('everyone');
  const [showStatsCard, setShowStatsCard] = useState(true);
  const [saving, setSaving] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const suggestion = useMemo(() => {
    if (!mealLog) {
      return '';
    }

    return `${mealLog.meal_name ?? formatMealSlot(mealLog.meal_slot)} today. ${activeGoal ? `Working toward ${formatGoalType(activeGoal.goal_type)}.` : ''}`.trim();
  }, [activeGoal, mealLog]);

  if (!mealLog) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}>
        <MoCard>
          <Text style={styles.title}>Meal log not found</Text>
        </MoCard>
      </ScrollView>
    );
  }

  const autoTags = [
    activeGoal?.country_code,
    activeGoal ? formatGoalType(activeGoal.goal_type) : null,
    formatMealSlot(mealLog.meal_slot),
    mealLog.total_calories ? `${mealLog.total_calories} kcal` : null,
    mealLog.total_protein_g ? `${Math.round(mealLog.total_protein_g)}g protein` : null,
  ].filter(Boolean) as string[];

  const handlePublish = async () => {
    if (!user) {
      return;
    }

    setSaving(true);
    try {
      const post = await healthFeedService.publishPost({
        mealLogId: mealLog.id,
        caption: caption || suggestion,
        audience,
        showStatsCard,
      });
      upsertFeedPost(post);
      setCelebrate(true);
      await new Promise((resolve) => setTimeout(resolve, 900));
      navigation.replace('HealthFeed');
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
      {celebrate ? <ConfettiCannon count={52} origin={{ x: -10, y: 0 }} fadeOut autoStart /> : null}
      <Text style={styles.title}>Share To Health Feed</Text>
      <MoCard>
        {mealLog.photo_url ? <Image source={{ uri: mealLog.photo_url }} style={styles.image} /> : null}
        <View style={styles.badgeRow}>
          <AccuracyScoreBadge score={mealLog.ai_accuracy_score} confidence={mealLog.ai_confidence} animated />
        </View>
      </MoCard>
      <MoCard>
        <MoInput label="Caption" multiline onChangeText={setCaption} value={caption} placeholder={suggestion} />
        <Pressable onPress={() => setCaption(suggestion)}>
          <Text style={styles.helper}>Suggested: {suggestion}</Text>
        </Pressable>
        <View style={styles.tagsRow}>
          {autoTags.map((tag) => (
            <Text key={tag} style={styles.tag}>{tag}</Text>
          ))}
        </View>
      </MoCard>
      <MoCard>
        <Text style={styles.sectionTitle}>Audience</Text>
        <View style={styles.row}>
          {[
            { label: 'Everyone', value: 'everyone' },
            { label: 'Fitness', value: 'fitness_community' },
            { label: 'Following', value: 'following' },
          ].map((item) => {
            const active = item.value === audience;
            return (
              <Text key={item.value} onPress={() => setAudience(item.value as typeof audience)} style={[styles.pill, active && styles.pillActive]}>
                {item.label}
              </Text>
            );
          })}
        </View>
      </MoCard>
      <MoCard>
        <Text style={styles.sectionTitle}>Meal Stats Card</Text>
        <View style={styles.row}>
          <Text onPress={() => setShowStatsCard(true)} style={[styles.pill, showStatsCard && styles.pillActive]}>Show</Text>
          <Text onPress={() => setShowStatsCard(false)} style={[styles.pill, !showStatsCard && styles.pillActive]}>Hide</Text>
        </View>
        <Text style={styles.helper}>This controls whether calories and macros appear under the photo in the feed.</Text>
      </MoCard>
      <MoButton loading={saving} onPress={() => void handlePublish()}>Post To Feed</MoButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingVertical: theme.spacing.lg },
  title: { ...typography.display_md, marginBottom: theme.spacing.md },
  image: { width: '100%', aspectRatio: 1, borderRadius: theme.radius.md },
  badgeRow: { marginTop: theme.spacing.md },
  helper: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.sm },
  sectionTitle: { ...typography.body_xl, marginBottom: theme.spacing.sm },
  row: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  tagsRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap', marginTop: theme.spacing.md },
  tag: {
    ...typography.caption,
    color: colors.text_secondary,
    backgroundColor: colors.bg_elevated,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    textTransform: 'capitalize',
  },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: colors.bg_elevated,
    overflow: 'hidden',
  },
  pillActive: {
    backgroundColor: colors.accent_green,
    color: colors.text_inverse,
  },
});
