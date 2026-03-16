import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { useCoachImage } from '../../../assets/coaches';
import { MoButton } from '../../../components/common/MoButton';
import type { FeedPost } from '../../../models';
import { useCoachStore } from '../../../stores/coachStore';
import { colors, theme, typography } from '../../../theme';
import { formatGoalType } from '../../../utils/nutrition';
import { AccuracyScoreBadge } from './AccuracyScoreBadge';

interface HealthFeedCardProps {
  post: FeedPost;
  authorName: string;
  onLike: () => void;
  onComment: () => void;
  onRate: (rating: number) => void;
  onPress: () => void;
  onToggleFollow?: () => void;
  canFollow?: boolean;
  isFollowing?: boolean;
  isLiked?: boolean;
}

function relativeTime(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function HealthFeedCard({
  post,
  authorName,
  onLike,
  onComment,
  onRate,
  onPress,
  onToggleFollow,
  canFollow = false,
  isFollowing = false,
  isLiked = false,
}: HealthFeedCardProps) {
  const coachName = useCoachStore((state) => state.coachName);
  const coachAvatar = useCoachImage("chat");
  const isVerifiedByCoach = (post.ai_accuracy_score ?? 0) >= 50;

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress} style={styles.tapArea}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.name}>{authorName}</Text>
            <Text style={styles.meta}>{post.country_code ?? 'Global'} | {relativeTime(post.created_at)}</Text>
            {isVerifiedByCoach ? (
              <View style={styles.verificationRow}>
                <Image source={coachAvatar} style={styles.verificationAvatar} accessibilityRole="image" accessibilityLabel={`${coachName} verification badge`} />
                <Text style={styles.verificationText}>{coachName} Verified ✓</Text>
              </View>
            ) : null}
            {post.goal_tag ? <Text style={styles.goalMeta}>{formatGoalType(post.goal_tag)}</Text> : null}
          </View>
          <View style={styles.headerActions}>
            {canFollow && onToggleFollow ? (
              <MoButton size="small" onPress={onToggleFollow} variant="ghost">
                {isFollowing ? 'Following' : 'Follow'}
              </MoButton>
            ) : null}
            <AccuracyScoreBadge score={post.ai_accuracy_score} confidence={post.confidence_score} />
          </View>
        </View>

        <Image source={{ uri: post.public_photo_url }} style={styles.image} />

        {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

        {post.show_stats_card ? (
          <View style={styles.statsStrip}>
            <Text style={styles.stats}>{post.total_calories ?? 0} kcal</Text>
            <Text style={styles.stats}>{Math.round(post.protein_g ?? 0)}g P</Text>
            <Text style={styles.stats}>{Math.round(post.carbs_g ?? 0)}g C</Text>
            <Text style={styles.stats}>{Math.round(post.fat_g ?? 0)}g F</Text>
          </View>
        ) : null}

        <View style={styles.tagsRow}>
          {post.country_code ? <Text style={styles.tag}>{post.country_code}</Text> : null}
          {post.goal_tag ? <Text style={styles.tag}>{formatGoalType(post.goal_tag)}</Text> : null}
          {post.cuisine_tag ? <Text style={styles.tag}>{post.cuisine_tag}</Text> : null}
        </View>

        <Text style={styles.meta}>{post.likes_count} likes | {post.comments_count} comments | {post.rating_avg.toFixed(1)} rating</Text>
      </Pressable>

      <View style={styles.actions}>
        <MoButton size="small" onPress={onLike} variant="secondary">{isLiked ? 'Unlike' : 'Like'}</MoButton>
        <MoButton size="small" onPress={onComment} variant="secondary">Comment</MoButton>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Text key={value} onPress={() => onRate(value)} style={styles.rating}>★</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg_surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  tapArea: {
    gap: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  name: {
    ...typography.body_xl,
  },
  meta: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  goalMeta: {
    ...typography.caption,
    color: colors.accent_green,
    textTransform: 'capitalize',
  },
  verificationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  verificationAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent_green,
  },
  verificationText: {
    ...typography.caption,
    color: colors.accent_green,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_elevated,
  },
  caption: {
    ...typography.body_md,
  },
  statsStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: colors.bg_elevated,
  },
  stats: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    ...typography.caption,
    color: colors.text_secondary,
    backgroundColor: colors.bg_elevated,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  rating: {
    fontSize: 18,
    color: colors.accent_amber,
    marginHorizontal: 2,
  },
});
