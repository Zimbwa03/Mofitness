import type { FeedPost, MealAnalysisResult, PlannedMeal } from '../models';

const rawPlan = {
  id: 'plan-1',
  user_id: 'user-1',
  goal_id: 'goal-1',
  plan_date: '2026-03-15',
  day_number: 1,
  total_calories: 620,
  total_protein_g: 34,
  total_carbs_g: 72,
  total_fat_g: 18,
  total_fiber_g: 9,
  total_sodium_mg: 320,
  water_target_liters: 3,
  water_schedule: [],
  meals: [
    {
      english_name: 'Cornmeal With Eggs',
      calories: 620,
      protein_g: 34,
      carbs_g: 72,
      fat_g: 18,
      dishes: [
        {
          name: 'Sadza',
          quantity_g: 250,
          quantity_display: '250g',
          calories: 240,
          protein_g: 5,
          carbs_g: 52,
          fat_g: 1,
          fiber_g: 2,
          cooking_method: 'Boiled',
          nutritional_benefit: 'Steady carbs.',
        },
      ],
    },
  ],
  ai_notes: 'Stay consistent.',
  workout_day: false,
  generated_image_url: null,
  created_at: '2026-03-15T06:00:00Z',
  updated_at: '2026-03-15T06:00:00Z',
};

const targetMeal: PlannedMeal = {
  slot: 'breakfast',
  local_name: 'Sadza ne Mazai',
  english_name: 'Cornmeal With Eggs',
  suggested_time: '07:30',
  prep_time_minutes: 20,
  difficulty: 'easy',
  why_this_meal: 'Protein first.',
  pre_meal_action: 'Drink water.',
  post_meal_action: 'Log the meal.',
  workout_relation: null,
  calories: 620,
  protein_g: 34,
  carbs_g: 72,
  fat_g: 18,
  fiber_g: 9,
  sodium_mg: 320,
  dishes: [
    {
      name: 'Sadza',
      local_name: null,
      quantity_g: 250,
      quantity_display: '250g',
      calories: 240,
      protein_g: 5,
      carbs_g: 52,
      fat_g: 1,
      fiber_g: 2,
      sodium_mg: 5,
      cooking_method: 'Boiled',
      nutritional_benefit: 'Steady carbs.',
    },
  ],
  ingredients_shopping: [],
  image_generation_prompt: 'Healthy plated breakfast',
};

describe('Edge function clients', () => {
  let invokeFunctionMock: jest.Mock;
  let mockGetCachedMealPlans: jest.Mock;
  let mockCacheMealPlans: jest.Mock;
  let mockGetCachedFeedPosts: jest.Mock;
  let mockCacheFeedPosts: jest.Mock;
  let nutritionAIService: typeof import('../services/ai/NutritionAIService').default;
  let mealVisionService: typeof import('../services/ai/MealVisionService').default;
  let mealImageGenService: typeof import('../services/ai/MealImageGenService').default;
  let healthFeedService: typeof import('../services/HealthFeedService').default;

  beforeEach(() => {
    jest.resetModules();
    invokeFunctionMock = jest.fn();
    mockGetCachedMealPlans = jest.fn().mockResolvedValue([]);
    mockCacheMealPlans = jest.fn().mockResolvedValue(undefined);
    mockGetCachedFeedPosts = jest.fn().mockResolvedValue([]);
    mockCacheFeedPosts = jest.fn().mockResolvedValue(undefined);

    jest.doMock('../services/SupabaseService', () => ({
      __esModule: true,
      default: {
        invokeFunction: (...args: unknown[]) => invokeFunctionMock(...args),
        getClient: () => ({
          from: jest.fn(),
        }),
      },
    }));

    jest.doMock('../services/OfflineSyncService', () => ({
      __esModule: true,
      default: {
        getCachedMealPlans: (...args: unknown[]) => mockGetCachedMealPlans(...args),
        cacheMealPlans: (...args: unknown[]) => mockCacheMealPlans(...args),
        getCachedFeedPosts: (...args: unknown[]) => mockGetCachedFeedPosts(...args),
        cacheFeedPosts: (...args: unknown[]) => mockCacheFeedPosts(...args),
      },
    }));

    nutritionAIService = require('../services/ai/NutritionAIService').default;
    mealVisionService = require('../services/ai/MealVisionService').default;
    mealImageGenService = require('../services/ai/MealImageGenService').default;
    healthFeedService = require('../services/HealthFeedService').default;
  });

  afterEach(() => {
    jest.dontMock('../services/SupabaseService');
    jest.dontMock('../services/OfflineSyncService');
  });

  it('calls nutrition-plan generate and normalizes the returned plan before caching it', async () => {
    invokeFunctionMock.mockResolvedValue(rawPlan);

    const result = await nutritionAIService.generateDailyMealPlan('2026-03-15', 'goal-1');

    expect(invokeFunctionMock).toHaveBeenCalledWith('nutrition-plan', {
      action: 'generate',
      planDate: '2026-03-15',
      goalId: 'goal-1',
    });
    expect(result?.meals[0].slot).toBe('dinner');
    expect(result?.meals[0].suggested_time).toBe('18:30');
    expect(mockCacheMealPlans).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'plan-1',
        meals: [expect.objectContaining({ slot: 'dinner' })],
      }),
    ]);
  });

  it('calls nutrition-plan adjust_remaining and normalizes meal defaults', async () => {
    invokeFunctionMock.mockResolvedValue({
      meals: [
        {
          english_name: 'Recovery Bowl',
          calories: 440,
          protein_g: 32,
          carbs_g: 48,
          fat_g: 12,
          dishes: [],
        },
      ],
    });

    const result = await nutritionAIService.adjustRemainingMeals({
      remainingMealSlots: ['dinner'],
      consumedCalories: 1200,
      consumedProtein: 80,
      consumedCarbs: 110,
      consumedFat: 32,
    });

    expect(invokeFunctionMock).toHaveBeenCalledWith('nutrition-plan', {
      action: 'adjust_remaining',
      remainingMealSlots: ['dinner'],
      consumedCalories: 1200,
      consumedProtein: 80,
      consumedCarbs: 110,
      consumedFat: 32,
    });
    expect(result[0]).toEqual(
      expect.objectContaining({
        slot: 'dinner',
        suggested_time: '18:30',
        local_name: 'Recovery Bowl',
      }),
    );
  });

  it('calls nutrition-meal-analysis with the expected payload', async () => {
    const analysis: MealAnalysisResult = {
      identified_dishes: [],
      total_calories_est: 580,
      total_protein_g_est: 42,
      total_carbs_g_est: 70,
      total_fat_g_est: 18,
      accuracy_score: 78,
      confidence: 81,
      accuracy_breakdown: {
        dish_match_score: 90,
        portion_score: 72,
        macro_score: 75,
        ingredient_score: 80,
      },
      matched_items: ['Sadza'],
      missing_items: [],
      extra_items: ['Oil'],
      feedback: 'Good match overall.',
      feed_eligible: true,
      feed_eligibility_reason: 'Score and confidence met the threshold.',
    };
    invokeFunctionMock.mockResolvedValue(analysis);

    const result = await mealVisionService.analyzeMealPhoto({
      photoBase64: 'base64-photo',
      mimeType: 'image/jpeg',
      targetMeal,
      userDescription: 'Sadza with eggs',
    });

    expect(invokeFunctionMock).toHaveBeenCalledWith('nutrition-meal-analysis', {
      photoBase64: 'base64-photo',
      mimeType: 'image/jpeg',
      targetMeal,
      userDescription: 'Sadza with eggs',
    });
    expect(result.accuracy_score).toBe(78);
  });

  it('calls nutrition-meal-image with the default realistic style', async () => {
    invokeFunctionMock.mockResolvedValue({
      imageUrl: 'https://example.com/meal.png',
      storagePath: 'meal-plan-images/meal.png',
      mimeType: 'image/png',
    });

    const result = await mealImageGenService.generateMealImage({
      meal: targetMeal,
      countryCode: 'ZW',
      countryName: 'Zimbabwe',
    });

    expect(invokeFunctionMock).toHaveBeenCalledWith('nutrition-meal-image', {
      meal: targetMeal,
      countryCode: 'ZW',
      countryName: 'Zimbabwe',
      style: 'realistic_photo',
      planId: undefined,
    });
    expect(result.imageUrl).toContain('meal.png');
  });

  it('calls nutrition-feed-publish and refreshes the offline post cache', async () => {
    const publishedPost: FeedPost = {
      id: 'post-new',
      user_id: 'user-1',
      meal_log_id: 'log-1',
      caption: 'New post',
      audience: 'everyone',
      show_stats_card: true,
      public_photo_url: 'https://example.com/post.jpg',
      public_photo_path: 'meal-feed/post.jpg',
      meal_name: 'Sadza Bowl',
      total_calories: 620,
      protein_g: 34,
      carbs_g: 72,
      fat_g: 18,
      ai_accuracy_score: 84,
      confidence_score: 88,
      country_code: 'ZW',
      cuisine_tag: 'sadza',
      goal_tag: 'build_muscle',
      likes_count: 0,
      comments_count: 0,
      rating_avg: 0,
      rating_count: 0,
      is_visible: true,
      created_at: '2026-03-15T06:00:00Z',
      updated_at: '2026-03-15T06:00:00Z',
    };

    mockGetCachedFeedPosts.mockResolvedValue([
      {
        id: 'post-old',
      },
    ]);
    invokeFunctionMock.mockResolvedValue(publishedPost);

    const result = await healthFeedService.publishPost({
      mealLogId: 'log-1',
      caption: 'New post',
      audience: 'everyone',
      showStatsCard: true,
    });

    expect(invokeFunctionMock).toHaveBeenCalledWith('nutrition-feed-publish', {
      mealLogId: 'log-1',
      caption: 'New post',
      audience: 'everyone',
      showStatsCard: true,
    });
    expect(mockCacheFeedPosts).toHaveBeenCalledWith([
      publishedPost,
      expect.objectContaining({ id: 'post-old' }),
    ]);
    expect(result.id).toBe('post-new');
  });
});
