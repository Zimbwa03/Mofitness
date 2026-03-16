import offlineSyncService, { type QueuedMealLogPayload, type QueuedMealPhoto, type SyncJob } from './OfflineSyncService';
import supabaseService from './SupabaseService';
import { buildMealLogPayload } from '../utils/mealLogs';

const FLUSH_TTL_MS = 10_000;

function isConnectivityError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('internet') ||
    message.includes('network') ||
    message.includes('timed out') ||
    message.includes('unable to reach') ||
    message.includes('failed to fetch')
  );
}

class OfflineMutationService {
  private isFlushing = false;
  private lastFlushAt = 0;

  private client = supabaseService.getClient();

  private async uploadQueuedMealPhoto(userId: string, photo: QueuedMealPhoto) {
    const response = await fetch(photo.uri);
    const blob = await response.blob();
    const storagePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${photo.extension}`;
    const { error } = await this.client.storage.from('meal-photos').upload(storagePath, blob, {
      contentType: photo.mimeType,
      upsert: false,
    });

    if (error) {
      throw error;
    }

    const { data, error: signedError } = await this.client.storage.from('meal-photos').createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    if (signedError) {
      throw signedError;
    }

    return {
      storagePath,
      signedUrl: data.signedUrl,
    };
  }

  private async executeMealLog(job: Extract<SyncJob, { type: 'meal_log' }>) {
    const { payload } = job;
    let uploadedPhoto: { signedUrl: string; storagePath: string } | null = null;

    if (payload.localPhoto) {
      uploadedPhoto = await this.uploadQueuedMealPhoto(payload.userId, payload.localPhoto);
    }

    const mealLogPayload = buildMealLogPayload(payload.userId, {
      planId: payload.planId ?? null,
      mealSlot: payload.mealSlot,
      logDate: payload.logDate,
      logMethod: payload.logMethod,
      mealName: payload.mealName ?? null,
      dishes: payload.dishes,
      description: payload.description ?? null,
      photoUrl: uploadedPhoto?.signedUrl ?? null,
      photoStoragePath: uploadedPhoto?.storagePath ?? null,
      analysis: payload.analysis ?? null,
    });

    const { error } = await this.client.from('meal_logs').upsert(mealLogPayload);
    if (error) {
      throw error;
    }
  }

  private async executeJob(job: SyncJob) {
    switch (job.type) {
      case 'feed_like': {
        if (job.payload.isLiked) {
          const { error } = await this.client.from('feed_likes').delete().eq('post_id', job.payload.postId).eq('user_id', job.payload.userId);
          if (error) {
            throw error;
          }
        } else {
          const { error } = await this.client.from('feed_likes').insert({ post_id: job.payload.postId, user_id: job.payload.userId });
          if (error) {
            throw error;
          }
        }
        return;
      }
      case 'feed_comment': {
        const { error } = await this.client.from('feed_comments').insert({
          post_id: job.payload.postId,
          user_id: job.payload.userId,
          body: job.payload.body,
          parent_comment_id: job.payload.parentCommentId ?? null,
        });
        if (error) {
          throw error;
        }
        return;
      }
      case 'feed_follow': {
        if (job.payload.isFollowing) {
          const { error } = await this.client
            .from('user_follows')
            .delete()
            .eq('follower_id', job.payload.followerId)
            .eq('following_id', job.payload.followingId);
          if (error) {
            throw error;
          }
        } else {
          const { error } = await this.client.from('user_follows').insert({
            follower_id: job.payload.followerId,
            following_id: job.payload.followingId,
          });
          if (error) {
            throw error;
          }
        }
        return;
      }
      case 'feed_rating': {
        const { error } = await this.client.from('feed_ratings').upsert({
          post_id: job.payload.postId,
          user_id: job.payload.userId,
          rating: job.payload.rating,
        });
        if (error) {
          throw error;
        }
        return;
      }
      case 'meal_log': {
        await this.executeMealLog(job);
        return;
      }
      default:
        return;
    }
  }

  async enqueueLike(postId: string, userId: string, isLiked: boolean) {
    return offlineSyncService.enqueue({
      type: 'feed_like',
      payload: { postId, userId, isLiked },
    });
  }

  async enqueueComment(postId: string, userId: string, body: string, parentCommentId?: string | null) {
    return offlineSyncService.enqueue({
      type: 'feed_comment',
      payload: { postId, userId, body, parentCommentId: parentCommentId ?? null },
    });
  }

  async enqueueFollow(followerId: string, followingId: string, isFollowing: boolean) {
    return offlineSyncService.enqueue({
      type: 'feed_follow',
      payload: { followerId, followingId, isFollowing },
    });
  }

  async enqueueRating(postId: string, userId: string, rating: number) {
    return offlineSyncService.enqueue({
      type: 'feed_rating',
      payload: { postId, userId, rating },
    });
  }

  async enqueueMealLog(payload: QueuedMealLogPayload) {
    return offlineSyncService.enqueue({
      type: 'meal_log',
      payload,
    });
  }

  async flushQueue(force = false) {
    if (this.isFlushing) {
      return;
    }

    if (!force && Date.now() - this.lastFlushAt < FLUSH_TTL_MS) {
      return;
    }

    this.isFlushing = true;
    this.lastFlushAt = Date.now();

    try {
      const queue = await offlineSyncService.getQueue();
      if (queue.length === 0) {
        return;
      }

      const remaining: SyncJob[] = [];

      for (let index = 0; index < queue.length; index += 1) {
        const job = queue[index];
        try {
          await this.executeJob(job);
        } catch (error) {
          if (isConnectivityError(error)) {
            remaining.push(
              {
                ...job,
                attempts: job.attempts + 1,
              },
              ...queue.slice(index + 1),
            );
            break;
          }

          remaining.push({
            ...job,
            attempts: job.attempts + 1,
          });
          console.warn('Offline job failed and remains queued.', error);
        }
      }

      await offlineSyncService.replaceQueue(remaining);
    } finally {
      this.isFlushing = false;
    }
  }
}

const offlineMutationService = new OfflineMutationService();

export default offlineMutationService;
