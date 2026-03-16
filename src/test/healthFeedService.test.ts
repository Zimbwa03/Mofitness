type QueryResult<T> = { data: T; error: unknown };

type QueryBuilder<T> = {
  select: jest.Mock;
  eq: jest.Mock;
  limit: jest.Mock;
  or: jest.Mock;
  in: jest.Mock;
  order: jest.Mock;
  neq: jest.Mock;
  delete: jest.Mock;
  insert: jest.Mock;
  upsert: jest.Mock;
  maybeSingle: jest.Mock;
  single: jest.Mock;
  returns: jest.Mock;
};

function createQueryBuilder<T>(result: QueryResult<T>): QueryBuilder<T> {
  const builder = {} as QueryBuilder<T>;
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.limit = jest.fn(() => builder);
  builder.or = jest.fn(() => builder);
  builder.in = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.neq = jest.fn(() => builder);
  builder.delete = jest.fn(() => builder);
  builder.insert = jest.fn(() => builder);
  builder.upsert = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(async () => result);
  builder.single = jest.fn(async () => result);
  builder.returns = jest.fn(async () => result);
  return builder;
}

const now = Date.now();
const makeIsoHoursAgo = (hoursAgo: number) => new Date(now - (hoursAgo * 3_600_000)).toISOString();

const posts = [
  {
    id: 'post-high',
    user_id: 'user-2',
    meal_log_id: 'log-1',
    caption: 'Sadza power bowl for strength day',
    audience: 'everyone',
    show_stats_card: true,
    public_photo_url: 'https://example.com/high.jpg',
    public_photo_path: null,
    meal_name: 'Sadza Bowl',
    total_calories: 640,
    protein_g: 38,
    carbs_g: 82,
    fat_g: 16,
    ai_accuracy_score: 82,
    confidence_score: 88,
    country_code: 'ZW',
    cuisine_tag: 'sadza',
    goal_tag: 'build_muscle',
    likes_count: 45,
    comments_count: 16,
    rating_avg: 4.8,
    rating_count: 12,
    is_visible: true,
    created_at: makeIsoHoursAgo(2),
    updated_at: makeIsoHoursAgo(2),
    user: { full_name: 'Mo One' },
  },
  {
    id: 'post-low',
    user_id: 'user-3',
    meal_log_id: 'log-2',
    caption: 'Sadza and greens',
    audience: 'everyone',
    show_stats_card: true,
    public_photo_url: 'https://example.com/low.jpg',
    public_photo_path: null,
    meal_name: 'Sadza Greens',
    total_calories: 420,
    protein_g: 19,
    carbs_g: 61,
    fat_g: 8,
    ai_accuracy_score: 67,
    confidence_score: 74,
    country_code: 'ZW',
    cuisine_tag: 'sadza',
    goal_tag: 'general_health',
    likes_count: 6,
    comments_count: 1,
    rating_avg: 4.1,
    rating_count: 2,
    is_visible: true,
    created_at: makeIsoHoursAgo(18),
    updated_at: makeIsoHoursAgo(18),
    user: { full_name: 'Mo Two' },
  },
  {
    id: 'post-other',
    user_id: 'user-4',
    meal_log_id: 'log-3',
    caption: 'Jollof rice lunch',
    audience: 'everyone',
    show_stats_card: false,
    public_photo_url: 'https://example.com/other.jpg',
    public_photo_path: null,
    meal_name: 'Jollof Rice',
    total_calories: 560,
    protein_g: 24,
    carbs_g: 75,
    fat_g: 14,
    ai_accuracy_score: 79,
    confidence_score: 84,
    country_code: 'NG',
    cuisine_tag: 'jollof',
    goal_tag: 'athletic_performance',
    likes_count: 20,
    comments_count: 4,
    rating_avg: 4.5,
    rating_count: 5,
    is_visible: true,
    created_at: makeIsoHoursAgo(3),
    updated_at: makeIsoHoursAgo(3),
    user: { full_name: 'Mo Three' },
  },
];

describe('HealthFeedService', () => {
  let mockFrom: jest.Mock;
  let mockGetCachedFeedPosts: jest.Mock;
  let mockCacheFeedPosts: jest.Mock;
  let mockGetCachedFeedComments: jest.Mock;
  let mockCacheFeedComments: jest.Mock;
  let mockGetCachedFeedActivity: jest.Mock;
  let mockCacheFeedActivity: jest.Mock;
  let mockFlushQueue: jest.Mock;
  let mockEnqueueLike: jest.Mock;
  let mockEnqueueComment: jest.Mock;
  let mockEnqueueFollow: jest.Mock;
  let mockEnqueueRating: jest.Mock;
  let healthFeedService: typeof import('../services/HealthFeedService').default;

  beforeEach(() => {
    jest.resetModules();
    mockFrom = jest.fn();
    mockGetCachedFeedPosts = jest.fn().mockResolvedValue([]);
    mockCacheFeedPosts = jest.fn().mockResolvedValue(undefined);
    mockGetCachedFeedComments = jest.fn().mockResolvedValue([]);
    mockCacheFeedComments = jest.fn().mockResolvedValue(undefined);
    mockGetCachedFeedActivity = jest.fn().mockResolvedValue([]);
    mockCacheFeedActivity = jest.fn().mockResolvedValue(undefined);
    mockFlushQueue = jest.fn().mockResolvedValue(undefined);
    mockEnqueueLike = jest.fn().mockResolvedValue({ id: 'job-like' });
    mockEnqueueComment = jest.fn().mockResolvedValue({ id: 'job-comment' });
    mockEnqueueFollow = jest.fn().mockResolvedValue({ id: 'job-follow' });
    mockEnqueueRating = jest.fn().mockResolvedValue({ id: 'job-rating' });

    jest.doMock('../services/SupabaseService', () => ({
      __esModule: true,
      default: {
        getClient: () => ({
          from: mockFrom,
        }),
        invokeFunction: jest.fn(),
      },
    }));

    jest.doMock('../services/OfflineSyncService', () => ({
      __esModule: true,
      default: {
        getCachedFeedPosts: (...args: unknown[]) => mockGetCachedFeedPosts(...args),
        cacheFeedPosts: (...args: unknown[]) => mockCacheFeedPosts(...args),
        getCachedFeedComments: (...args: unknown[]) => mockGetCachedFeedComments(...args),
        cacheFeedComments: (...args: unknown[]) => mockCacheFeedComments(...args),
        getCachedFeedActivity: (...args: unknown[]) => mockGetCachedFeedActivity(...args),
        cacheFeedActivity: (...args: unknown[]) => mockCacheFeedActivity(...args),
      },
    }));

    jest.doMock('../services/OfflineMutationService', () => ({
      __esModule: true,
      default: {
        flushQueue: (...args: unknown[]) => mockFlushQueue(...args),
        enqueueLike: (...args: unknown[]) => mockEnqueueLike(...args),
        enqueueComment: (...args: unknown[]) => mockEnqueueComment(...args),
        enqueueFollow: (...args: unknown[]) => mockEnqueueFollow(...args),
        enqueueRating: (...args: unknown[]) => mockEnqueueRating(...args),
      },
    }));

    healthFeedService = require('../services/HealthFeedService').default;
  });

  afterEach(() => {
    jest.dontMock('../services/SupabaseService');
    jest.dontMock('../services/OfflineSyncService');
    jest.dontMock('../services/OfflineMutationService');
  });

  it('filters by search term and sorts trending posts', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'feed_posts') {
        return createQueryBuilder({ data: posts, error: null });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await healthFeedService.getFeedPosts({
      sort: 'trending',
      searchTerm: 'sadza',
      limit: 5,
    });

    expect(result.map((post) => post.id)).toEqual(['post-high', 'post-low']);
    expect(mockFlushQueue).toHaveBeenCalled();
    expect(mockCacheFeedPosts).toHaveBeenCalledWith(posts);
  });

  it('falls back to cached feed posts on connectivity errors', async () => {
    mockGetCachedFeedPosts.mockResolvedValue([posts[1]]);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'feed_posts') {
        return createQueryBuilder({ data: null, error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await healthFeedService.getFeedPosts({ sort: 'recent', limit: 5 });

    expect(result.map((post) => post.id)).toEqual(['post-low']);
    expect(mockCacheFeedPosts).not.toHaveBeenCalled();
  });

  it('falls back to cached comments on connectivity errors', async () => {
    mockGetCachedFeedComments.mockResolvedValue([
      {
        id: 'comment-1',
        post_id: 'post-high',
        user_id: 'user-3',
        parent_comment_id: null,
        body: 'Saved offline comment',
        created_at: makeIsoHoursAgo(1),
        updated_at: makeIsoHoursAgo(1),
        user: { full_name: 'Mo Two' },
      },
    ]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'feed_comments') {
        return createQueryBuilder({ data: null, error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await healthFeedService.getCommentsWithStatus('post-high');

    expect(result.source).toBe('cache');
    expect(result.reason).toBe('connectivity');
    expect(result.data[0]?.body).toBe('Saved offline comment');
  });

  it('falls back to cached activity on connectivity errors', async () => {
    mockGetCachedFeedActivity.mockResolvedValue([
      {
        id: 'like-post-high-user-3',
        type: 'like',
        actor_name: 'Mo Two',
        post_id: 'post-high',
        post_name: 'Sadza Bowl',
        body: null,
        created_at: makeIsoHoursAgo(2),
      },
    ]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'feed_posts') {
        return createQueryBuilder({ data: null, error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await healthFeedService.getFeedActivityWithStatus('user-1');

    expect(result.source).toBe('cache');
    expect(result.reason).toBe('connectivity');
    expect(result.data[0]?.post_id).toBe('post-high');
  });

  it('queues likes when the network is unavailable', async () => {
    const likeBuilder = createQueryBuilder({ data: null, error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') });
    likeBuilder.insert.mockResolvedValue({ error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') });
    likeBuilder.delete.mockReturnValue({
      eq: jest.fn(() => ({
        eq: jest.fn(async () => ({ error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') })),
      })),
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'feed_likes') {
        return likeBuilder;
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await healthFeedService.toggleLike('post-high', 'user-1', false);

    expect(result).toEqual({ queued: true });
    expect(mockEnqueueLike).toHaveBeenCalledWith('post-high', 'user-1', false);
  });

  it('queues follows when the network is unavailable', async () => {
    const followBuilder = createQueryBuilder({ data: null, error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') });
    followBuilder.insert.mockResolvedValue({ error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') });
    followBuilder.delete.mockReturnValue({
      eq: jest.fn(() => ({
        eq: jest.fn(async () => ({ error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') })),
      })),
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_follows') {
        return followBuilder;
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await healthFeedService.toggleFollow('user-1', 'user-2', false);

    expect(result).toEqual({ queued: true });
    expect(mockEnqueueFollow).toHaveBeenCalledWith('user-1', 'user-2', false);
  });

  it('queues ratings when the network is unavailable', async () => {
    const ratingBuilder = createQueryBuilder({ data: null, error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') });
    ratingBuilder.upsert.mockReturnValue({
      select: jest.fn(() => ({
        single: jest.fn(async () => ({ data: null, error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') })),
      })),
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'feed_ratings') {
        return ratingBuilder;
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await healthFeedService.ratePost('post-high', 'user-1', 5);

    expect(result.queued).toBe(true);
    expect(result.rating).toBe(5);
    expect(mockEnqueueRating).toHaveBeenCalledWith('post-high', 'user-1', 5);
  });

  it('queues comments when the network is unavailable', async () => {
    const commentBuilder = createQueryBuilder({ data: null, error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') });
    commentBuilder.insert.mockReturnValue({
      select: jest.fn(() => ({
        single: jest.fn(async () => ({ data: null, error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') })),
      })),
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'feed_comments') {
        return commentBuilder;
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await healthFeedService.addComment('post-high', 'user-1', 'Offline comment', null);

    expect(result.pending_sync).toBe(true);
    expect(result.queued_job_id).toBe('job-comment');
    expect(mockEnqueueComment).toHaveBeenCalledWith('post-high', 'user-1', 'Offline comment', null);
  });
});
