type QueryResult<T> = { data: T; error: unknown };

type QueryBuilder<T> = {
  select: jest.Mock;
  eq: jest.Mock;
  maybeSingle: jest.Mock;
  returns: jest.Mock;
  order: jest.Mock;
  gte: jest.Mock;
  contains: jest.Mock;
  upsert: jest.Mock;
  single: jest.Mock;
};

function createQueryBuilder<T>(result: QueryResult<T>): QueryBuilder<T> {
  const builder = {} as QueryBuilder<T>;
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.gte = jest.fn(() => builder);
  builder.contains = jest.fn(() => builder);
  builder.upsert = jest.fn(() => builder);
  builder.maybeSingle = jest.fn(async () => result);
  builder.single = jest.fn(async () => result);
  builder.returns = jest.fn(async () => result);
  return builder;
}

const plan = {
  id: 'plan-1',
  user_id: 'user-1',
  goal_id: 'goal-1',
  plan_date: '2026-03-15',
  day_number: 1,
  total_calories: 2400,
  total_protein_g: 160,
  total_carbs_g: 250,
  total_fat_g: 70,
  total_fiber_g: 30,
  total_sodium_mg: 2100,
  water_target_liters: 3,
  water_schedule: [],
  meals: [
    {
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
    },
  ],
  ai_notes: 'Stay consistent.',
  workout_day: false,
  generated_image_url: null,
  created_at: '2026-03-15T06:00:00Z',
  updated_at: '2026-03-15T06:00:00Z',
};

describe('NutritionService', () => {
  let mockFrom: jest.Mock;
  let mockGetCachedMealPlans: jest.Mock;
  let mockCacheMealPlans: jest.Mock;
  let mockFlushQueue: jest.Mock;
  let mockEnqueueMealLog: jest.Mock;
  let nutritionService: typeof import('../services/NutritionService').default;

  beforeEach(() => {
    jest.resetModules();
    mockFrom = jest.fn();
    mockGetCachedMealPlans = jest.fn().mockResolvedValue([]);
    mockCacheMealPlans = jest.fn().mockResolvedValue(undefined);
    mockFlushQueue = jest.fn().mockResolvedValue(undefined);
    mockEnqueueMealLog = jest.fn().mockResolvedValue({ id: 'job-meal-log' });

    jest.doMock('../services/SupabaseService', () => ({
      __esModule: true,
      default: {
        getClient: () => ({
          from: mockFrom,
        }),
      },
    }));

    jest.doMock('../services/OfflineSyncService', () => ({
      __esModule: true,
      default: {
        getCachedMealPlans: (...args: unknown[]) => mockGetCachedMealPlans(...args),
        cacheMealPlans: (...args: unknown[]) => mockCacheMealPlans(...args),
      },
    }));

    jest.doMock('../services/OfflineMutationService', () => ({
      __esModule: true,
      default: {
        flushQueue: (...args: unknown[]) => mockFlushQueue(...args),
        enqueueMealLog: (...args: unknown[]) => mockEnqueueMealLog(...args),
      },
    }));

    nutritionService = require('../services/NutritionService').default;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.dontMock('../services/SupabaseService');
    jest.dontMock('../services/OfflineSyncService');
    jest.dontMock('../services/OfflineMutationService');
  });

  it('returns and caches the remote plan for a date', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'daily_meal_plans') {
        return createQueryBuilder({ data: plan, error: null });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await nutritionService.getPlanForDate('user-1', '2026-03-15');

    expect(result?.id).toBe('plan-1');
    expect(mockCacheMealPlans).toHaveBeenCalledWith([expect.objectContaining({ id: 'plan-1' })]);
  });

  it('falls back to cached plans on connectivity failure', async () => {
    mockGetCachedMealPlans.mockResolvedValue([plan]);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'daily_meal_plans') {
        return createQueryBuilder({ data: null, error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await nutritionService.getPlanForDate('user-1', '2026-03-15');

    expect(result?.id).toBe('plan-1');
    expect(mockCacheMealPlans).not.toHaveBeenCalled();
  });

  it('merges remote country cuisines with the bundled fallback catalog', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'country_cuisines') {
        return createQueryBuilder({
          data: [
            {
              country_code: 'ZW',
              country_name: 'Zimbabwe',
              cuisine_tags: ['sadza'],
              staples: ['sadza'],
              proteins: ['beef'],
              carbs: ['sadza'],
              vegetables: ['covo'],
            },
          ],
          error: null,
        });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await nutritionService.getCountryCuisines();
    const zimbabwe = result.find((row) => row.country_code === 'ZW');
    const india = result.find((row) => row.country_code === 'IN');

    expect(zimbabwe).toBeDefined();
    expect(zimbabwe?.cuisine_tags).toEqual(expect.arrayContaining(['sadza', 'nyama']));
    expect(india).toBeDefined();
  });

  it('falls back to bundled regional foods when the remote query fails', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'regional_foods') {
        return createQueryBuilder({
          data: [],
          error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.'),
        });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await nutritionService.getRegionalFoods('ZW');

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((row) => row.country_codes.includes('ZW'))).toBe(true);
    expect(result.map((row) => row.name)).toContain('Sadza (Cooked)');
  });

  it('reports a cached meal plan source on connectivity fallback', async () => {
    mockGetCachedMealPlans.mockResolvedValue([plan]);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'daily_meal_plans') {
        return createQueryBuilder({ data: null, error: new Error('Unable to reach Mofitness servers. Check your internet connection and try again.') });
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const result = await nutritionService.getPlanForDateWithStatus('user-1', '2026-03-15');

    expect(result.source).toBe('cache');
    expect(result.reason).toBe('connectivity');
    expect(result.data?.id).toBe('plan-1');
  });

  it('queues meal logs when the upload path is offline', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unable to reach Mofitness servers. Check your internet connection and try again.'));

    const result = await nutritionService.saveMealLogWithOfflineSupport(
      'user-1',
      {
        mealSlot: 'breakfast',
        logDate: '2026-03-15',
        logMethod: 'photo',
        mealName: 'Sadza Bowl',
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
      },
      {
        localPhoto: {
          uri: 'file:///meal.jpg',
          mimeType: 'image/jpeg',
          extension: 'jpg',
        },
      },
    );

    expect(mockEnqueueMealLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        mealSlot: 'breakfast',
        logMethod: 'photo',
      }),
    );
    expect(result.pending_sync).toBe(true);
    expect(result.queued_job_id).toBe('job-meal-log');

    fetchSpy.mockRestore();
  });
});
