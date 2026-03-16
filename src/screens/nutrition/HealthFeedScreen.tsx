import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachMessageBubble } from '../../components/coach/CoachMessageBubble';
import { MoButton } from '../../components/common/MoButton';
import { MoCard } from '../../components/common/MoCard';
import { MoInput } from '../../components/common/MoInput';
import { useAuth } from '../../hooks/useAuth';
import type { NutritionStackParamList } from '../../navigation/types';
import healthFeedService, { type FeedPostRecord } from '../../services/HealthFeedService';
import realtimeFeedService from '../../services/RealtimeFeedService';
import { useOfflineQueueStore } from '../../stores/offlineQueueStore';
import { useNutritionStore } from '../../stores/nutritionStore';
import { colors, layout, theme, typography } from '../../theme';
import { getTabScreenBottomPadding } from '../../utils/screen';
import { HealthFeedCard } from './components/HealthFeedCard';
import { OfflineStateBanner } from './components/OfflineStateBanner';
import { PendingSyncBanner } from './components/PendingSyncBanner';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<NutritionStackParamList, 'HealthFeed'>;

export function HealthFeedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const activeGoal = useNutritionStore((state) => state.activeGoal);
  const feedPosts = useNutritionStore((state) => state.feedPosts);
  const setFeedPosts = useNutritionStore((state) => state.setFeedPosts);
  const pendingSyncCount = useOfflineQueueStore((state) => state.pendingCount);
  const [filter, setFilter] = useState<'global' | 'country' | 'goal' | 'following'>('global');
  const [sort, setSort] = useState<'recent' | 'most_liked' | 'top_rated' | 'trending'>('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedSource, setFeedSource] = useState<'remote' | 'cache' | 'none'>('none');
  const [feedSourceReason, setFeedSourceReason] = useState<'connectivity' | 'local_cache' | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const result = await healthFeedService.getFeedPostsWithStatus({
        filter,
        countryCode: activeGoal?.country_code,
        goalTag: activeGoal?.goal_type,
        sort,
        searchTerm,
        viewerUserId: user?.id,
      });
      const posts = result.data;
      setFeedPosts(posts);
      setFeedSource(result.source);
      setFeedSourceReason(result.reason);

      if (user) {
        try {
          const [likes, follows] = await Promise.all([
            healthFeedService.getLikedPostIds(user.id, posts.map((post) => post.id)),
            healthFeedService.getFollowingIds(user.id),
          ]);
          setLikedIds(likes);
          setFollowingIds(follows);
        } catch (secondaryError) {
          console.warn('Feed relationship state unavailable.', secondaryError);
          setLikedIds([]);
          setFollowingIds([]);
        }
      }
    } catch (error) {
      console.error('Failed to load health feed', error);
      const message = error instanceof Error ? error.message : 'Unable to load the health feed.';
      Alert.alert('Feed Unavailable', message);
    } finally {
      setLoading(false);
    }
  }, [activeGoal?.country_code, activeGoal?.goal_type, filter, searchTerm, setFeedPosts, sort, user]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const unsubscribe = realtimeFeedService.subscribeToFeed(() => {
      void loadFeed();
    });
    return unsubscribe;
  }, [loadFeed]);

  const emptyMessage = useMemo(() => {
    if (feedSource === 'none' && feedSourceReason === 'connectivity') {
      return 'You appear to be offline and there are no cached feed posts on this device yet.';
    }

    if (filter === 'following') {
      return 'Follow a few people first, then their meal posts will appear here.';
    }

    if (searchTerm.trim()) {
      return `No feed posts matched "${searchTerm.trim()}".`;
    }

    return 'Log a photo meal with enough confidence, then publish it here.';
  }, [feedSource, feedSourceReason, filter, searchTerm]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <MoInput label="Search meals, captions, or cuisines" onChangeText={setSearchTerm} value={searchTerm} style={styles.search} />
        <MoButton size="small" onPress={() => navigation.navigate('FeedNotifications')} variant="secondary">Alerts</MoButton>
      </View>

      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {[
            { label: 'Global', value: 'global' },
            { label: 'My Country', value: 'country' },
            { label: 'My Goal', value: 'goal' },
            { label: 'Following', value: 'following' },
          ].map((item) => {
            const active = item.value === filter;
            return (
              <Text key={item.value} onPress={() => setFilter(item.value as typeof filter)} style={[styles.filterChip, active && styles.filterChipActive]}>
                {item.label}
              </Text>
            );
          })}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {[
            { label: 'Recent', value: 'recent' },
            { label: 'Most Liked', value: 'most_liked' },
            { label: 'Top Rated', value: 'top_rated' },
            { label: 'Trending', value: 'trending' },
          ].map((item) => {
            const active = item.value === sort;
            return (
              <Text key={item.value} onPress={() => setSort(item.value as typeof sort)} style={[styles.filterChip, active && styles.filterChipActive]}>
                {item.label}
              </Text>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.bannerWrap}>
        <PendingSyncBanner count={pendingSyncCount} body="Queued likes, follows, ratings, comments, and meal logs will sync the next time the network is available." />
      </View>
      <View style={styles.bannerWrap}>
        <CoachMessageBubble
          feature="Nutrition Feed"
          pose="chat"
          message="I verify meal quality and coach the community feed. Tap any post and I will break down what to improve."
        />
      </View>

      {feedSource === 'cache' ? (
        <View style={styles.bannerWrap}>
          <OfflineStateBanner
            title="Showing cached feed posts"
            body={
              feedSourceReason === 'connectivity'
                ? 'The feed could not reach the network, so this list is coming from the last posts stored on this device.'
                : 'This feed view is using posts already stored on this device.'
            }
          />
        </View>
      ) : null}

      <FlashList<FeedPostRecord>
        data={feedPosts as FeedPostRecord[]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: layout.screen_padding_h, paddingBottom: getTabScreenBottomPadding(insets.bottom) }}
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <HealthFeedCard
              post={item}
              authorName={item.user?.full_name ?? 'Mofitness User'}
              canFollow={Boolean(user && item.user_id !== user.id)}
              isFollowing={followingIds.includes(item.user_id)}
              isLiked={likedIds.includes(item.id)}
              onToggleFollow={() => {
                if (!user || item.user_id === user.id) {
                  return;
                }
                const isFollowing = followingIds.includes(item.user_id);
                setFollowingIds((current) => (isFollowing ? current.filter((id) => id !== item.user_id) : [...current, item.user_id]));
                void healthFeedService.toggleFollow(user.id, item.user_id, isFollowing).then((result) => {
                  if (result.queued) {
                    return;
                  }
                  setFollowingIds((current) => (isFollowing ? current.filter((id) => id !== item.user_id) : [...current, item.user_id]));
                  if (filter === 'following') {
                    void loadFeed();
                  }
                });
              }}
              onPress={() => navigation.navigate('HealthFeedDetail', { postId: item.id })}
              onLike={() => {
                if (!user) {
                  return;
                }
                const isLiked = likedIds.includes(item.id);
                setLikedIds((current) => (isLiked ? current.filter((id) => id !== item.id) : [...current, item.id]));
                void healthFeedService.toggleLike(item.id, user.id, isLiked).then((result) => {
                  if (result.queued) {
                    return;
                  }
                  setLikedIds((current) => (isLiked ? current.filter((id) => id !== item.id) : [...current, item.id]));
                  void loadFeed();
                });
              }}
              onComment={() => navigation.navigate('HealthFeedDetail', { postId: item.id })}
              onRate={(rating) => {
                if (!user) {
                  return;
                }
                void healthFeedService.ratePost(item.id, user.id, rating).then((result) => {
                  if (result.queued) {
                    return;
                  }
                  void loadFeed();
                });
              }}
            />
          </View>
        )}
        ListEmptyComponent={
          <MoCard>
            <Text style={styles.emptyTitle}>{loading ? 'Loading feed...' : 'No feed posts yet'}</Text>
            <Text style={styles.emptyBody}>{emptyMessage}</Text>
          </MoCard>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  topBar: { paddingHorizontal: layout.screen_padding_h, paddingTop: theme.spacing.md, flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'flex-end' },
  search: { flex: 1 },
  filtersWrap: { paddingTop: theme.spacing.md },
  filters: { paddingHorizontal: layout.screen_padding_h, gap: theme.spacing.sm, paddingBottom: theme.spacing.sm },
  bannerWrap: { paddingHorizontal: layout.screen_padding_h },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: colors.bg_elevated,
    overflow: 'hidden',
  },
  filterChipActive: {
    backgroundColor: colors.accent_green,
    color: colors.text_inverse,
  },
  cardWrap: { paddingBottom: theme.spacing.md },
  emptyTitle: { ...typography.display_sm, marginBottom: theme.spacing.sm },
  emptyBody: { ...typography.body_md, color: colors.text_secondary },
});
