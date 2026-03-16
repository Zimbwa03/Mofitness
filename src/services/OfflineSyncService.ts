import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DailyMealPlan, FeedAudience, FeedPost, MealAnalysisResult, MealLogMethod, MealSlot, PlannedDish, WorkoutPlanItem } from '../models';
import { useOfflineQueueStore } from '../stores/offlineQueueStore';

const WORKOUTS_KEY = 'mofitness:offline:workouts';
const MEAL_PLANS_KEY = 'mofitness:offline:meal_plans';
const FEED_POSTS_KEY = 'mofitness:offline:feed_posts';
const SYNC_QUEUE_KEY = 'mofitness:offline:queue';
const FEED_COMMENTS_KEY_PREFIX = 'mofitness:offline:feed_comments:';
const FEED_ACTIVITY_KEY_PREFIX = 'mofitness:offline:feed_activity:';

export interface QueuedMealPhoto {
  uri: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: string;
}

export interface QueuedMealLogPayload {
  userId: string;
  planId?: string | null;
  mealSlot: MealSlot;
  logDate: string;
  logMethod: MealLogMethod;
  mealName?: string | null;
  dishes: PlannedDish[];
  description?: string | null;
  analysis?: MealAnalysisResult | null;
  localPhoto?: QueuedMealPhoto | null;
}

export type SyncJob =
  | { id: string; created_at: string; attempts: number; type: 'feed_like'; payload: { postId: string; userId: string; isLiked: boolean } }
  | { id: string; created_at: string; attempts: number; type: 'feed_comment'; payload: { postId: string; userId: string; body: string; parentCommentId?: string | null } }
  | { id: string; created_at: string; attempts: number; type: 'feed_follow'; payload: { followerId: string; followingId: string; isFollowing: boolean } }
  | { id: string; created_at: string; attempts: number; type: 'feed_rating'; payload: { postId: string; userId: string; rating: number } }
  | { id: string; created_at: string; attempts: number; type: 'meal_log'; payload: QueuedMealLogPayload };

function makeJobId() {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

class OfflineSyncService {
  private syncPendingCount() {
    void this.getQueue().then((queue) => {
      useOfflineQueueStore.getState().setPendingCount(queue.length);
    });
  }

  async cacheWorkouts(workouts: WorkoutPlanItem[]) {
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  }

  async cacheMealPlans(mealPlans: DailyMealPlan[]) {
    await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
  }

  async cacheFeedPosts(feedPosts: FeedPost[]) {
    await AsyncStorage.setItem(FEED_POSTS_KEY, JSON.stringify(feedPosts.slice(0, 20)));
  }

  async cacheFeedComments(postId: string, comments: unknown[]) {
    await AsyncStorage.setItem(`${FEED_COMMENTS_KEY_PREFIX}${postId}`, JSON.stringify(comments));
  }

  async cacheFeedActivity(userId: string, activity: unknown[]) {
    await AsyncStorage.setItem(`${FEED_ACTIVITY_KEY_PREFIX}${userId}`, JSON.stringify(activity));
  }

  async getCachedWorkouts() {
    const raw = await AsyncStorage.getItem(WORKOUTS_KEY);
    return raw ? (JSON.parse(raw) as WorkoutPlanItem[]) : [];
  }

  async getCachedMealPlans() {
    const raw = await AsyncStorage.getItem(MEAL_PLANS_KEY);
    return raw ? (JSON.parse(raw) as DailyMealPlan[]) : [];
  }

  async getCachedFeedPosts() {
    const raw = await AsyncStorage.getItem(FEED_POSTS_KEY);
    return raw ? (JSON.parse(raw) as FeedPost[]) : [];
  }

  async getCachedFeedComments<T>(postId: string) {
    const raw = await AsyncStorage.getItem(`${FEED_COMMENTS_KEY_PREFIX}${postId}`);
    return raw ? (JSON.parse(raw) as T[]) : [];
  }

  async getCachedFeedActivity<T>(userId: string) {
    const raw = await AsyncStorage.getItem(`${FEED_ACTIVITY_KEY_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as T[]) : [];
  }

  async enqueue(job: Omit<SyncJob, 'id' | 'created_at' | 'attempts'>) {
    const queue = await this.getQueue();
    queue.push({
      ...job,
      id: makeJobId(),
      created_at: new Date().toISOString(),
      attempts: 0,
    } as SyncJob);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    this.syncPendingCount();
    return queue[queue.length - 1] as SyncJob;
  }

  async flushQueue() {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    useOfflineQueueStore.getState().setPendingCount(0);
  }

  async getQueue() {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SyncJob[]) : [];
  }

  async replaceQueue(queue: SyncJob[]) {
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    useOfflineQueueStore.getState().setPendingCount(queue.length);
  }

  async hydratePendingCount() {
    this.syncPendingCount();
  }
}

const offlineSyncService = new OfflineSyncService();
void offlineSyncService.hydratePendingCount();

export default offlineSyncService;
