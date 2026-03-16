import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoButton } from '../../components/common/MoButton';
import { MoCard } from '../../components/common/MoCard';
import { MoInput } from '../../components/common/MoInput';
import { useAuth } from '../../hooks/useAuth';
import type { NutritionStackParamList } from '../../navigation/types';
import healthFeedService, { type FeedCommentRecord, type FeedPostRecord } from '../../services/HealthFeedService';
import { useOfflineQueueStore } from '../../stores/offlineQueueStore';
import { colors, layout, theme, typography } from '../../theme';
import { formatGoalType } from '../../utils/nutrition';
import { getScreenBottomPadding } from '../../utils/screen';
import { AccuracyScoreBadge } from './components/AccuracyScoreBadge';
import { OfflineStateBanner } from './components/OfflineStateBanner';
import { PendingSyncBanner } from './components/PendingSyncBanner';

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

  return `${Math.floor(hours / 24)}d ago`;
}

type Props = NativeStackScreenProps<NutritionStackParamList, 'HealthFeedDetail'>;

export function HealthFeedDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const pendingSyncCount = useOfflineQueueStore((state) => state.pendingCount);
  const [post, setPost] = useState<FeedPostRecord | null>(null);
  const [comments, setComments] = useState<FeedCommentRecord[]>([]);
  const [similarPosts, setSimilarPosts] = useState<FeedPostRecord[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState<FeedCommentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [postSource, setPostSource] = useState<'remote' | 'cache' | 'none'>('none');
  const [postSourceReason, setPostSourceReason] = useState<'connectivity' | 'local_cache' | null>(null);
  const [commentsSource, setCommentsSource] = useState<'remote' | 'cache' | 'none'>('none');
  const [commentsSourceReason, setCommentsSourceReason] = useState<'connectivity' | 'local_cache' | null>(null);

  const loadData = useCallback(async () => {
    const postResult = await healthFeedService.getFeedPostWithStatus(route.params.postId);
    const currentPost = postResult.data;
    setPost(currentPost);
    setPostSource(postResult.source);
    setPostSourceReason(postResult.reason);
    if (!currentPost) {
      return;
    }

    const [commentsResult, similarRows] = await Promise.all([
      healthFeedService.getCommentsWithStatus(currentPost.id),
      healthFeedService.getSimilarPosts(currentPost, 4),
    ]);

    setComments(commentsResult.data);
    setCommentsSource(commentsResult.source);
    setCommentsSourceReason(commentsResult.reason);
    setSimilarPosts(similarRows);

    if (user) {
      try {
        const [likedIds, followingIds] = await Promise.all([
          healthFeedService.getLikedPostIds(user.id, [currentPost.id]),
          healthFeedService.getFollowingIds(user.id),
        ]);
        setLiked(likedIds.includes(currentPost.id));
        setFollowing(followingIds.includes(currentPost.user_id));
      } catch (secondaryError) {
        console.warn('Feed relationship state unavailable for detail screen.', secondaryError);
        setLiked(false);
        setFollowing(false);
      }
    }
  }, [route.params.postId, user]);

  useEffect(() => {
    void loadData().catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to load this post.';
      Alert.alert('Feed Post Unavailable', message);
    });
  }, [loadData]);

  const orderedComments = useMemo(() => {
    const parents = comments.filter((comment) => !comment.parent_comment_id);
    const childrenByParent = new Map<string, FeedCommentRecord[]>();
    comments
      .filter((comment) => comment.parent_comment_id)
      .forEach((comment) => {
        const parentId = comment.parent_comment_id as string;
        const bucket = childrenByParent.get(parentId) ?? [];
        bucket.push(comment);
        childrenByParent.set(parentId, bucket);
      });

    return parents.flatMap((parent) => [parent, ...(childrenByParent.get(parent.id) ?? [])]);
  }, [comments]);

  const handleLike = async () => {
    if (!user || !post) {
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setPost((current) =>
      current
        ? {
            ...current,
            likes_count: Math.max(0, current.likes_count + (nextLiked ? 1 : -1)),
          }
        : current,
    );

    const result = await healthFeedService.toggleLike(post.id, user.id, liked);
    if (!result.queued) {
      await loadData();
    }
  };

  const handleFollow = async () => {
    if (!user || !post || post.user_id === user.id) {
      return;
    }

    const nextFollowing = !following;
    setFollowing(nextFollowing);
    const result = await healthFeedService.toggleFollow(user.id, post.user_id, following);
    if (result.queued) {
      return;
    }
  };

  const handleRate = async (rating: number) => {
    if (!user || !post) {
      return;
    }

    setPost((current) =>
      current
        ? {
            ...current,
            rating_avg: rating,
            rating_count: Math.max(1, current.rating_count),
          }
        : current,
    );
    const result = await healthFeedService.ratePost(post.id, user.id, rating);
    if (!result.queued) {
      await loadData();
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !post || !commentBody.trim()) {
      return;
    }

    setSaving(true);
    try {
      const comment = await healthFeedService.addComment(post.id, user.id, commentBody.trim(), replyTo?.id ?? null);
      setComments((current) => [...current, comment]);
      setPost((current) =>
        current
          ? {
              ...current,
              comments_count: current.comments_count + 1,
            }
          : current,
      );
      setCommentBody('');
      setReplyTo(null);
      if (comment.pending_sync) {
        Alert.alert('Saved Offline', 'Your comment is queued and will sync automatically when the network is back.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!post) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}>
        <MoCard>
          <Text style={styles.title}>{postSourceReason === 'connectivity' ? 'Feed post unavailable offline' : 'Feed post not found'}</Text>
          {postSourceReason === 'connectivity' ? (
            <Text style={styles.meta}>This device does not have a cached copy of the post yet.</Text>
          ) : null}
        </MoCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
      showsVerticalScrollIndicator={false}
    >
      {postSource === 'cache' ? (
        <OfflineStateBanner
          title="Showing a cached meal post"
          body={
            postSourceReason === 'connectivity'
              ? 'The post could not be refreshed from the network, so you are seeing the last saved version from this device.'
              : 'This post is currently being shown from device storage.'
          }
        />
      ) : null}

      <PendingSyncBanner count={pendingSyncCount} body="Queued likes, comments, ratings, follows, and meal logs sync automatically when Mofitness reconnects." />

      <MoCard>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{post.user?.full_name ?? 'Mofitness User'}</Text>
            <Text style={styles.meta}>{post.country_code ?? 'Global'} | {relativeTime(post.created_at)}</Text>
          </View>
          {user && post.user_id !== user.id ? (
            <MoButton size="small" onPress={() => void handleFollow()} variant="ghost">
              {following ? 'Following' : 'Follow'}
            </MoButton>
          ) : null}
        </View>
        <View style={styles.badgeRow}>
          <AccuracyScoreBadge score={post.ai_accuracy_score} confidence={post.confidence_score} />
        </View>
      </MoCard>

      <MoCard>
        {post.public_photo_url ? (
          <Image source={{ uri: post.public_photo_url }} style={styles.image} />
        ) : (
          <View style={styles.imageWrap}>
            <Text style={styles.imageFallback}>Meal photo unavailable</Text>
          </View>
        )}
      </MoCard>

      <MoCard>
        <Text style={styles.mealName}>{post.meal_name}</Text>
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
        <View style={styles.actions}>
          <MoButton size="small" onPress={() => void handleLike()} variant="secondary">{liked ? 'Unlike' : 'Like'}</MoButton>
          <MoButton size="small" onPress={() => setReplyTo(null)} variant="secondary">Comment</MoButton>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Text key={value} onPress={() => void handleRate(value)} style={styles.rating}>★</Text>
            ))}
          </View>
        </View>
      </MoCard>

      {commentsSource === 'cache' ? (
        <OfflineStateBanner
          title="Showing cached comments"
          body={
            commentsSourceReason === 'connectivity'
              ? 'Comments could not be refreshed from the network, so this thread is using the last saved replies from this device.'
              : 'This comment thread is currently being shown from device storage.'
          }
        />
      ) : null}

      <MoCard>
        <Text style={styles.sectionTitle}>Comments</Text>
        {replyTo ? <Text style={styles.replyingTo}>Replying to {replyTo.user?.full_name ?? 'User'}</Text> : null}
        <MoInput label={replyTo ? 'Reply' : 'Comment'} onChangeText={setCommentBody} value={commentBody} multiline />
        <View style={styles.replyActions}>
          {replyTo ? <MoButton size="small" onPress={() => setReplyTo(null)} variant="ghost">Cancel Reply</MoButton> : null}
          <MoButton size="small" onPress={() => void handleSubmitComment()} loading={saving}>Send</MoButton>
        </View>
        <View style={styles.commentList}>
          {orderedComments.map((comment) => {
            const isReply = Boolean(comment.parent_comment_id);
            return (
              <View key={comment.id} style={[styles.commentRow, isReply && styles.replyRow]}>
                <Text style={styles.commentAuthor}>{comment.user?.full_name ?? 'User'} | {relativeTime(comment.created_at)}</Text>
                <Text style={styles.commentBody}>{comment.body}</Text>
                {comment.pending_sync ? <Text style={styles.pendingLabel}>Waiting to sync</Text> : null}
                {!isReply ? <Text onPress={() => setReplyTo(comment)} style={styles.replyLink}>Reply</Text> : null}
              </View>
            );
          })}
          {orderedComments.length === 0 && commentsSourceReason === 'connectivity' ? (
            <Text style={styles.meta}>You are offline and there are no cached comments for this post yet.</Text>
          ) : null}
        </View>
      </MoCard>

      <MoCard>
        <Text style={styles.sectionTitle}>See Similar Meals</Text>
        <View style={styles.similarList}>
          {similarPosts.map((item) => (
            <Pressable key={item.id} onPress={() => navigation.push('HealthFeedDetail', { postId: item.id })} style={styles.similarCard}>
              <Text style={styles.similarTitle}>{item.meal_name}</Text>
              <Text style={styles.meta}>{item.user?.full_name ?? 'Mofitness User'}</Text>
              <Text style={styles.meta}>{item.rating_avg.toFixed(1)} rating | {item.likes_count} likes</Text>
            </Pressable>
          ))}
          {similarPosts.length === 0 ? <Text style={styles.meta}>No similar meals found yet.</Text> : null}
        </View>
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingVertical: theme.spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md },
  title: { ...typography.display_sm },
  mealName: { ...typography.display_md },
  meta: { ...typography.body_sm, color: colors.text_secondary },
  badgeRow: { marginTop: theme.spacing.sm },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radius.md,
    backgroundColor: colors.bg_elevated,
  },
  imageFallback: { ...typography.body_xl, color: colors.text_secondary },
  caption: { ...typography.body_md, marginTop: theme.spacing.sm },
  statsStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  stats: { ...typography.body_sm, color: colors.text_secondary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  tag: {
    ...typography.caption,
    color: colors.text_secondary,
    backgroundColor: colors.bg_elevated,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    textTransform: 'capitalize',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  ratingRow: { flexDirection: 'row', marginLeft: 'auto' },
  rating: { fontSize: 18, color: colors.accent_amber, marginHorizontal: 2 },
  sectionTitle: { ...typography.body_xl, marginBottom: theme.spacing.sm },
  replyingTo: { ...typography.body_sm, color: colors.accent_green, marginBottom: theme.spacing.sm },
  replyActions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  commentList: { gap: theme.spacing.md, marginTop: theme.spacing.md },
  commentRow: { paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: colors.border_subtle },
  replyRow: { marginLeft: theme.spacing.lg },
  commentAuthor: { ...typography.body_sm, color: colors.accent_green },
  commentBody: { ...typography.body_md, marginTop: theme.spacing.xs },
  pendingLabel: { ...typography.caption, color: colors.accent_amber, marginTop: theme.spacing.xs },
  replyLink: { ...typography.caption, color: colors.accent_amber, marginTop: theme.spacing.xs },
  similarList: { gap: theme.spacing.sm },
  similarCard: {
    backgroundColor: colors.bg_elevated,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  similarTitle: { ...typography.body_xl },
});
