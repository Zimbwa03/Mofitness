import type { FeedActivityItem, FeedComment, FeedPost, FeedPublishInput, FeedRating } from '../models';
import offlineSyncService from './OfflineSyncService';
import offlineMutationService from './OfflineMutationService';
import supabaseService from './SupabaseService';

type FeedFilter = 'global' | 'country' | 'goal' | 'following';
type FeedSort = 'recent' | 'most_liked' | 'top_rated' | 'trending';

interface FeedUserRow {
  full_name: string;
}

interface FeedLikeRow {
  post_id: string;
  user_id: string;
  liked_at: string;
  user?: FeedUserRow | null;
}

export interface FeedPostRecord extends FeedPost {
  user?: FeedUserRow | null;
}

export interface FeedCommentRecord extends FeedComment {
  user?: FeedUserRow | null;
}

export interface OfflineReadResult<T> {
  data: T;
  source: 'remote' | 'cache' | 'none';
  reason: 'connectivity' | 'local_cache' | null;
}

function hoursSince(timestamp: string) {
  return Math.max(1, (Date.now() - new Date(timestamp).getTime()) / 3_600_000);
}

function trendingScore(post: FeedPost) {
  const engagement = (post.likes_count * 3) + (post.comments_count * 4) + (post.rating_avg * Math.max(1, post.rating_count));
  return engagement / Math.pow(hoursSince(post.created_at), 0.65);
}

function matchesSearch(post: FeedPost, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }

  const haystack = [post.meal_name, post.caption ?? '', post.cuisine_tag ?? '', post.country_code ?? '', post.goal_tag ?? '']
    .join(' ')
    .toLowerCase();

  return haystack.includes(searchTerm.toLowerCase());
}

function filterAndSortPosts(
  posts: FeedPostRecord[],
  options: {
    filter?: FeedFilter;
    countryCode?: string | null;
    goalTag?: string | null;
    sort?: FeedSort;
    limit?: number;
    searchTerm?: string;
  },
  followingIds: string[],
) {
  const sort = options.sort ?? 'recent';
  const limit = options.limit ?? 20;
  const searchTerm = options.searchTerm?.trim() ?? '';

  let filtered = posts.filter((post) => post.is_visible);

  if (options.filter === 'country' && options.countryCode) {
    filtered = filtered.filter((post) => post.country_code === options.countryCode);
  }

  if (options.filter === 'goal' && options.goalTag) {
    filtered = filtered.filter((post) => post.goal_tag === options.goalTag);
  }

  if (options.filter === 'following') {
    filtered = filtered.filter((post) => followingIds.includes(post.user_id));
  }

  filtered = filtered.filter((post) => matchesSearch(post, searchTerm));

  if (sort === 'most_liked') {
    return filtered
      .sort((a, b) => (b.likes_count - a.likes_count) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      .slice(0, limit);
  }

  if (sort === 'top_rated') {
    return filtered.sort((a, b) => (b.rating_avg - a.rating_avg) || (b.rating_count - a.rating_count)).slice(0, limit);
  }

  if (sort === 'trending') {
    return filtered.sort((a, b) => trendingScore(b) - trendingScore(a)).slice(0, limit);
  }

  return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
}

function isConnectivityError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('internet') ||
    message.includes('network') ||
    message.includes('timed out') ||
    message.includes('unable to reach')
  );
}

class HealthFeedService {
  private client = supabaseService.getClient();

  async getFollowingIds(userId: string) {
    const { data, error } = await this.client
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId)
      .returns<Array<{ following_id: string }>>();

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => row.following_id);
  }

  async toggleFollow(followerId: string, followingId: string, isFollowing: boolean) {
    try {
      if (isFollowing) {
        const { error } = await this.client
          .from('user_follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await this.client.from('user_follows').insert({
          follower_id: followerId,
          following_id: followingId,
        });

        if (error) {
          throw error;
        }
      }

      return { queued: false };
    } catch (error) {
      if (!isConnectivityError(error)) {
        throw error;
      }

      await offlineMutationService.enqueueFollow(followerId, followingId, isFollowing);
      return { queued: true };
    }
  }

  async getFeedPosts(options?: {
    filter?: FeedFilter;
    countryCode?: string | null;
    goalTag?: string | null;
    sort?: FeedSort;
    limit?: number;
    searchTerm?: string;
    viewerUserId?: string | null;
  }) {
    const result = await this.getFeedPostsWithStatus(options);
    return result.data;
  }

  async getFeedPostsWithStatus(options?: {
    filter?: FeedFilter;
    countryCode?: string | null;
    goalTag?: string | null;
    sort?: FeedSort;
    limit?: number;
    searchTerm?: string;
    viewerUserId?: string | null;
  }): Promise<OfflineReadResult<FeedPostRecord[]>> {
    await offlineMutationService.flushQueue();

    const sort = options?.sort ?? 'recent';
    const limit = options?.limit ?? 20;
    const searchTerm = options?.searchTerm?.trim() ?? '';
    const viewerUserId = options?.viewerUserId ?? null;
    const followingIds = options?.filter === 'following' && viewerUserId ? await this.getFollowingIds(viewerUserId) : [];

    if (options?.filter === 'following' && followingIds.length === 0) {
      return {
        data: [],
        source: 'none',
        reason: null,
      };
    }

    try {
      let query = this.client
        .from('feed_posts')
        .select('*, user:users(full_name)')
        .eq('is_visible', true)
        .limit(Math.max(limit, 40));

      if (options?.filter === 'country' && options.countryCode) {
        query = query.eq('country_code', options.countryCode);
      }

      if (options?.filter === 'goal' && options.goalTag) {
        query = query.eq('goal_tag', options.goalTag);
      }

      if (options?.filter === 'following' && followingIds.length > 0) {
        query = query.in('user_id', followingIds);
      }

      if (searchTerm) {
        query = query.or(`meal_name.ilike.%${searchTerm}%,caption.ilike.%${searchTerm}%,cuisine_tag.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.returns<FeedPostRecord[]>();
      if (error) {
        throw error;
      }

      const posts = data ?? [];
      await offlineSyncService.cacheFeedPosts(posts);
      return {
        data: filterAndSortPosts(posts, options ?? {}, followingIds),
        source: 'remote',
        reason: null,
      };
    } catch (error) {
      if (isConnectivityError(error)) {
        const cachedPosts = (await offlineSyncService.getCachedFeedPosts()) as FeedPostRecord[];
        return {
          data: filterAndSortPosts(cachedPosts, options ?? {}, followingIds),
          source: cachedPosts.length > 0 ? 'cache' : 'none',
          reason: 'connectivity',
        };
      }

      throw error;
    }
  }

  async getFeedPost(postId: string) {
    const result = await this.getFeedPostWithStatus(postId);
    return result.data;
  }

  async getFeedPostWithStatus(postId: string): Promise<OfflineReadResult<FeedPostRecord | null>> {
    await offlineMutationService.flushQueue();

    try {
      const { data, error } = await this.client
        .from('feed_posts')
        .select('*, user:users(full_name)')
        .eq('id', postId)
        .maybeSingle<FeedPostRecord>();

      if (error) {
        throw error;
      }

      if (data) {
        return {
          data,
          source: 'remote',
          reason: null,
        };
      }

      const cachedPosts = (await offlineSyncService.getCachedFeedPosts()) as FeedPostRecord[];
      const cachedPost = cachedPosts.find((post) => post.id === postId) ?? null;

      return {
        data: cachedPost,
        source: cachedPost ? 'cache' : 'none',
        reason: cachedPost ? 'local_cache' : null,
      };
    } catch (error) {
      if (isConnectivityError(error)) {
        const cachedPosts = (await offlineSyncService.getCachedFeedPosts()) as FeedPostRecord[];
        const cachedPost = cachedPosts.find((post) => post.id === postId) ?? null;
        return {
          data: cachedPost,
          source: cachedPost ? 'cache' : 'none',
          reason: 'connectivity',
        };
      }

      throw error;
    }
  }

  async getSimilarPosts(post: FeedPost, limit = 6) {
    try {
      let query = this.client
        .from('feed_posts')
        .select('*, user:users(full_name)')
        .eq('is_visible', true)
        .neq('id', post.id)
        .limit(limit * 2);

      if (post.cuisine_tag) {
        query = query.eq('cuisine_tag', post.cuisine_tag);
      } else if (post.goal_tag) {
        query = query.eq('goal_tag', post.goal_tag);
      } else if (post.country_code) {
        query = query.eq('country_code', post.country_code);
      }

      const { data, error } = await query.returns<FeedPostRecord[]>();
      if (error) {
        throw error;
      }

      return (data ?? []).slice(0, limit);
    } catch (error) {
      if (isConnectivityError(error)) {
        const cachedPosts = (await offlineSyncService.getCachedFeedPosts()) as FeedPostRecord[];
        return filterAndSortPosts(
          cachedPosts.filter((item) => item.id !== post.id),
          {
            filter: post.cuisine_tag ? undefined : post.goal_tag ? 'goal' : post.country_code ? 'country' : 'global',
            countryCode: post.country_code,
            goalTag: post.goal_tag,
            sort: 'top_rated',
            limit,
            searchTerm: post.cuisine_tag ?? '',
          },
          [],
        );
      }

      throw error;
    }
  }

  async getLikedPostIds(userId: string, postIds?: string[]) {
    let query = this.client.from('feed_likes').select('post_id').eq('user_id', userId);
    if (postIds && postIds.length > 0) {
      query = query.in('post_id', postIds);
    }

    const { data, error } = await query.returns<Array<{ post_id: string }>>();
    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => row.post_id);
  }

  async publishPost(input: FeedPublishInput) {
    const data = await supabaseService.invokeFunction<FeedPost>('nutrition-feed-publish', input);
    const cachedPosts = await offlineSyncService.getCachedFeedPosts();
    await offlineSyncService.cacheFeedPosts([data, ...cachedPosts.filter((post) => post.id !== data.id)]);
    return data as FeedPost;
  }

  async toggleLike(postId: string, userId: string, isLiked: boolean) {
    try {
      if (isLiked) {
        const { error } = await this.client.from('feed_likes').delete().eq('post_id', postId).eq('user_id', userId);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await this.client.from('feed_likes').insert({ post_id: postId, user_id: userId });
        if (error) {
          throw error;
        }
      }

      return { queued: false };
    } catch (error) {
      if (!isConnectivityError(error)) {
        throw error;
      }

      await offlineMutationService.enqueueLike(postId, userId, isLiked);
      return { queued: true };
    }
  }

  async getComments(postId: string) {
    const result = await this.getCommentsWithStatus(postId);
    return result.data;
  }

  async getCommentsWithStatus(postId: string): Promise<OfflineReadResult<FeedCommentRecord[]>> {
    await offlineMutationService.flushQueue();

    try {
      const { data, error } = await this.client
        .from('feed_comments')
        .select('*, user:users(full_name)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .returns<FeedCommentRecord[]>();

      if (error) {
        throw error;
      }

      const comments = data ?? [];
      await offlineSyncService.cacheFeedComments(postId, comments);
      return {
        data: comments,
        source: 'remote',
        reason: null,
      };
    } catch (error) {
      if (isConnectivityError(error)) {
        const cachedComments = await offlineSyncService.getCachedFeedComments<FeedCommentRecord>(postId);
        return {
          data: cachedComments,
          source: cachedComments.length > 0 ? 'cache' : 'none',
          reason: 'connectivity',
        };
      }

      throw error;
    }
  }

  async addComment(postId: string, userId: string, body: string, parentCommentId?: string | null) {
    try {
      const { data, error } = await this.client
        .from('feed_comments')
        .insert({
          post_id: postId,
          user_id: userId,
          body,
          parent_comment_id: parentCommentId ?? null,
        })
        .select('*, user:users(full_name)')
        .single<FeedCommentRecord>();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      if (!isConnectivityError(error)) {
        throw error;
      }

      const queuedJob = await offlineMutationService.enqueueComment(postId, userId, body, parentCommentId ?? null);
      const now = new Date().toISOString();
      return {
        id: `offline-comment-${Date.now()}`,
        post_id: postId,
        user_id: userId,
        parent_comment_id: parentCommentId ?? null,
        body,
        pending_sync: true,
        queued_job_id: queuedJob.id,
        created_at: now,
        updated_at: now,
      } as FeedCommentRecord;
    }
  }

  async ratePost(postId: string, userId: string, rating: number) {
    try {
      const { data, error } = await this.client
        .from('feed_ratings')
        .upsert({
          post_id: postId,
          user_id: userId,
          rating,
        })
        .select('*')
        .single<FeedRating>();

      if (error) {
        throw error;
      }

      return {
        ...data,
        queued: false,
      };
    } catch (error) {
      if (!isConnectivityError(error)) {
        throw error;
      }

      await offlineMutationService.enqueueRating(postId, userId, rating);
      return {
        post_id: postId,
        user_id: userId,
        rating,
        rated_at: new Date().toISOString(),
        queued: true,
      };
    }
  }

  async getFeedActivity(userId: string, limit = 20) {
    const result = await this.getFeedActivityWithStatus(userId, limit);
    return result.data;
  }

  async getFeedActivityWithStatus(userId: string, limit = 20): Promise<OfflineReadResult<FeedActivityItem[]>> {
    await offlineMutationService.flushQueue();

    try {
      const { data: posts, error: postsError } = await this.client
        .from('feed_posts')
        .select('id, meal_name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(25)
        .returns<Array<{ id: string; meal_name: string }>>();

      if (postsError) {
        throw postsError;
      }

      const postIds = (posts ?? []).map((post) => post.id);
      if (postIds.length === 0) {
        return {
          data: [],
          source: 'remote',
          reason: null,
        };
      }

      const mealNameByPostId = new Map((posts ?? []).map((post) => [post.id, post.meal_name]));

      const [commentsResponse, likesResponse] = await Promise.all([
        this.client
          .from('feed_comments')
          .select('id, post_id, body, created_at, user:users(full_name), user_id')
          .in('post_id', postIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)
          .returns<Array<{ id: string; post_id: string; body: string; created_at: string; user_id: string; user?: FeedUserRow | null }>>(),
        this.client
          .from('feed_likes')
          .select('post_id, user_id, liked_at, user:users(full_name)')
          .in('post_id', postIds)
          .neq('user_id', userId)
          .order('liked_at', { ascending: false })
          .limit(limit)
          .returns<FeedLikeRow[]>(),
      ]);

      if (commentsResponse.error) {
        throw commentsResponse.error;
      }

      if (likesResponse.error) {
        throw likesResponse.error;
      }

      const commentItems: FeedActivityItem[] = (commentsResponse.data ?? []).map((comment) => ({
        id: `comment-${comment.id}`,
        type: 'comment',
        actor_name: comment.user?.full_name ?? 'User',
        post_id: comment.post_id,
        post_name: mealNameByPostId.get(comment.post_id) ?? 'Meal post',
        body: comment.body,
        created_at: comment.created_at,
      }));

      const likeItems: FeedActivityItem[] = (likesResponse.data ?? []).map((like) => ({
        id: `like-${like.post_id}-${like.user_id}`,
        type: 'like',
        actor_name: like.user?.full_name ?? 'User',
        post_id: like.post_id,
        post_name: mealNameByPostId.get(like.post_id) ?? 'Meal post',
        body: null,
        created_at: like.liked_at,
      }));

      const activity = [...commentItems, ...likeItems]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      await offlineSyncService.cacheFeedActivity(userId, activity);

      return {
        data: activity,
        source: 'remote',
        reason: null,
      };
    } catch (error) {
      if (isConnectivityError(error)) {
        const cachedActivity = await offlineSyncService.getCachedFeedActivity<FeedActivityItem>(userId);
        return {
          data: cachedActivity.slice(0, limit),
          source: cachedActivity.length > 0 ? 'cache' : 'none',
          reason: 'connectivity',
        };
      }

      throw error;
    }
  }
}

const healthFeedService = new HealthFeedService();

export default healthFeedService;
