import type {
  BodyMetricLog,
  CountryCuisine,
  DailyMealPlan,
  MealAnalysisResult,
  MealLog,
  NutritionGoal,
  NutritionGoalDraft,
  PlannedDish,
  RegionalFood,
  WaterLog,
} from '../models';
import { FALLBACK_COUNTRY_CUISINES, FALLBACK_REGIONAL_FOODS } from '../data/nutritionCatalog';
import { useAuthStore } from '../stores/authStore';
import { buildMealLogPayload, buildOptimisticMealLog, type MealLogDraftInput } from '../utils/mealLogs';
import { normalizeDailyMealPlan } from '../utils/nutrition';
import offlineSyncService from './OfflineSyncService';
import offlineMutationService from './OfflineMutationService';
import nutritionAIService from './ai/NutritionAIService';
import supabaseService from './SupabaseService';

interface SaveMealLogInput extends MealLogDraftInput {}

export interface MealPlanReadResult {
  data: DailyMealPlan | null;
  source: 'remote' | 'cache' | 'none';
  reason: 'connectivity' | 'local_cache' | null;
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

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function compareByName<T extends { country_name?: string; name?: string }>(left: T, right: T) {
  const leftName = left.country_name ?? left.name ?? '';
  const rightName = right.country_name ?? right.name ?? '';
  return leftName.localeCompare(rightName);
}

function mergeCountryCuisine(base: CountryCuisine | undefined, incoming: CountryCuisine): CountryCuisine {
  return {
    country_code: incoming.country_code.toUpperCase(),
    country_name: incoming.country_name || base?.country_name || incoming.country_code.toUpperCase(),
    cuisine_tags: uniqueStrings([...(base?.cuisine_tags ?? []), ...incoming.cuisine_tags]),
    staples: uniqueStrings([...(base?.staples ?? []), ...incoming.staples]),
    proteins: uniqueStrings([...(base?.proteins ?? []), ...incoming.proteins]),
    carbs: uniqueStrings([...(base?.carbs ?? []), ...incoming.carbs]),
    vegetables: uniqueStrings([...(base?.vegetables ?? []), ...incoming.vegetables]),
  };
}

function mergeCountryCuisines(primary: CountryCuisine[], fallback: CountryCuisine[]) {
  const map = new Map<string, CountryCuisine>();

  fallback.forEach((item) => {
    map.set(item.country_code.toUpperCase(), item);
  });

  primary.forEach((item) => {
    const key = item.country_code.toUpperCase();
    map.set(key, mergeCountryCuisine(map.get(key), item));
  });

  return Array.from(map.values()).sort(compareByName);
}

function mergeRegionalFood(base: RegionalFood | undefined, incoming: RegionalFood): RegionalFood {
  return {
    id: incoming.id || base?.id || incoming.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: incoming.name,
    local_name: incoming.local_name ?? base?.local_name ?? null,
    country_codes: uniqueStrings([...(base?.country_codes ?? []), ...incoming.country_codes.map((code) => code.toUpperCase())]),
    calories_per_100g: incoming.calories_per_100g ?? base?.calories_per_100g ?? 0,
    protein_g: incoming.protein_g ?? base?.protein_g ?? 0,
    carbs_g: incoming.carbs_g ?? base?.carbs_g ?? 0,
    fat_g: incoming.fat_g ?? base?.fat_g ?? 0,
    fiber_g: incoming.fiber_g ?? base?.fiber_g ?? 0,
    iron_mg: incoming.iron_mg ?? base?.iron_mg ?? null,
    calcium_mg: incoming.calcium_mg ?? base?.calcium_mg ?? null,
    sodium_mg: incoming.sodium_mg ?? base?.sodium_mg ?? null,
    category: incoming.category ?? base?.category ?? 'mixed_dish',
  };
}

function mergeRegionalFoods(primary: RegionalFood[], fallback: RegionalFood[]) {
  const map = new Map<string, RegionalFood>();

  fallback.forEach((item) => {
    map.set(item.name.trim().toLowerCase(), {
      ...item,
      country_codes: item.country_codes.map((code) => code.toUpperCase()),
    });
  });

  primary.forEach((item) => {
    const key = item.name.trim().toLowerCase();
    map.set(key, mergeRegionalFood(map.get(key), item));
  });

  return Array.from(map.values()).sort(compareByName);
}

function filterRegionalFoods(rows: RegionalFood[], countryCode?: string) {
  if (!countryCode) {
    return rows;
  }

  const normalizedCode = countryCode.toUpperCase();
  return rows.filter((row) => row.country_codes.map((code) => code.toUpperCase()).includes(normalizedCode));
}

class NutritionService {
  private client = supabaseService.getClient();

  private async getCachedMealPlans() {
    const cached = await offlineSyncService.getCachedMealPlans();
    return cached
      .map((plan) => normalizeDailyMealPlan(plan))
      .filter((plan): plan is DailyMealPlan => plan !== null);
  }

  private async cacheMealPlans(nextPlans: DailyMealPlan[]) {
    const cachedPlans = await this.getCachedMealPlans();
    const merged = [...nextPlans];

    cachedPlans.forEach((cachedPlan) => {
      if (!merged.some((plan) => plan.id === cachedPlan.id)) {
        merged.push(cachedPlan);
      }
    });

    await offlineSyncService.cacheMealPlans(merged.sort((a, b) => new Date(b.plan_date).getTime() - new Date(a.plan_date).getTime()));
  }

  async getActiveGoal(userId: string) {
    const { data, error } = await this.client
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle<NutritionGoal>();

    if (error) {
      throw error;
    }

    return data ?? null;
  }

  async saveGoal(userId: string, draft: NutritionGoalDraft) {
    const profile = useAuthStore.getState().profile;
    const preferences = useAuthStore.getState().preferences;

    if (!profile) {
      throw new Error('Missing user profile for nutrition goal creation.');
    }

    await this.client.from('nutrition_goals').update({ is_active: false }).eq('user_id', userId).eq('is_active', true);

    const payload = {
      user_id: userId,
      ...nutritionAIService.buildGoalPayload(draft, profile, preferences),
    };

    const { data, error } = await this.client.from('nutrition_goals').insert(payload).select('*').single<NutritionGoal>();

    if (error) {
      throw error;
    }

    return data;
  }

  async getPlanForDate(userId: string, planDate: string) {
    const result = await this.getPlanForDateWithStatus(userId, planDate);
    return result.data;
  }

  async getPlanForDateWithStatus(userId: string, planDate: string): Promise<MealPlanReadResult> {
    const cachedPlan = (await this.getCachedMealPlans()).find((plan) => plan.plan_date === planDate) ?? null;

    try {
      const { data, error } = await this.client
        .from('daily_meal_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_date', planDate)
        .maybeSingle<DailyMealPlan>();

      if (error) {
        throw error;
      }

      const normalized = normalizeDailyMealPlan(data);
      if (normalized) {
        await this.cacheMealPlans([normalized]);
        return {
          data: normalized,
          source: 'remote',
          reason: null,
        };
      }

      if (cachedPlan) {
        return {
          data: cachedPlan,
          source: 'cache',
          reason: 'local_cache',
        };
      }

      return {
        data: null,
        source: 'none',
        reason: null,
      };
    } catch (error) {
      if (cachedPlan && isConnectivityError(error)) {
        return {
          data: cachedPlan,
          source: 'cache',
          reason: 'connectivity',
        };
      }

      throw error;
    }
  }

  async getPlans(userId: string, fromDate?: string) {
    const cachedPlans = await this.getCachedMealPlans();

    try {
      let query = this.client.from('daily_meal_plans').select('*').eq('user_id', userId).order('plan_date', { ascending: false });
      if (fromDate) {
        query = query.gte('plan_date', fromDate);
      }

      const { data, error } = await query.returns<DailyMealPlan[]>();
      if (error) {
        throw error;
      }

      const normalizedPlans = (data ?? [])
        .map((plan) => normalizeDailyMealPlan(plan))
        .filter((plan): plan is DailyMealPlan => plan !== null);

      await this.cacheMealPlans(normalizedPlans);

      return normalizedPlans;
    } catch (error) {
      if (isConnectivityError(error)) {
        return fromDate ? cachedPlans.filter((plan) => plan.plan_date >= fromDate) : cachedPlans;
      }

      throw error;
    }
  }

  async getMealLogs(userId: string, logDate?: string) {
    await offlineMutationService.flushQueue();

    let query = this.client.from('meal_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false });
    if (logDate) {
      query = query.eq('log_date', logDate);
    }

    const { data, error } = await query.returns<MealLog[]>();
    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async saveMealLog(userId: string, input: SaveMealLogInput) {
    const payload = buildMealLogPayload(userId, input);

    const { data, error } = await this.client.from('meal_logs').upsert(payload).select('*').single<MealLog>();
    if (error) {
      throw error;
    }

    return data;
  }

  async saveMealLogWithOfflineSupport(
    userId: string,
    input: SaveMealLogInput,
    options?: {
      localPhoto?: {
        uri: string;
        mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
        extension: string;
      } | null;
    },
  ) {
    try {
      let uploadedPhoto: { storagePath: string; signedUrl: string } | null = null;
      if (options?.localPhoto) {
        const photoBlob = await fetch(options.localPhoto.uri).then((response) => response.blob());
        uploadedPhoto = await this.uploadMealPhoto(userId, photoBlob, options.localPhoto.mimeType, options.localPhoto.extension);
      }

      return await this.saveMealLog(userId, {
        ...input,
        photoUrl: uploadedPhoto?.signedUrl ?? null,
        photoStoragePath: uploadedPhoto?.storagePath ?? null,
      });
    } catch (error) {
      if (!isConnectivityError(error)) {
        throw error;
      }

      const queuedJob = await offlineMutationService.enqueueMealLog({
        userId,
        planId: input.planId ?? null,
        mealSlot: input.mealSlot,
        logDate: input.logDate,
        logMethod: input.logMethod,
        mealName: input.mealName ?? null,
        dishes: input.dishes,
        description: input.description ?? null,
        analysis: input.analysis ?? null,
        localPhoto: options?.localPhoto ?? null,
      });

      return buildOptimisticMealLog(userId, input, {
        queuedJobId: queuedJob.id,
        photoUrl: options?.localPhoto?.uri ?? null,
        photoStoragePath: null,
      });
    }
  }

  async deleteMealLog(id: string, userId: string) {
    const { error } = await this.client.from('meal_logs').delete().eq('id', id).eq('user_id', userId);
    if (error) {
      throw error;
    }
  }

  async uploadMealPhoto(userId: string, file: Blob | ArrayBuffer | Uint8Array, mimeType: string, extension: string) {
    const storagePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const { error } = await this.client.storage.from('meal-photos').upload(storagePath, file, {
      contentType: mimeType,
      upsert: false,
    });

    if (error) {
      throw error;
    }

    const { data: signedData, error: signedError } = await this.client.storage.from('meal-photos').createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    if (signedError) {
      throw signedError;
    }

    return {
      storagePath,
      signedUrl: signedData.signedUrl,
    };
  }

  async getSignedMealPhotoUrl(storagePath: string) {
    const { data, error } = await this.client.storage.from('meal-photos').createSignedUrl(storagePath, 60 * 60 * 24);
    if (error) {
      throw error;
    }

    return data.signedUrl;
  }

  async getCountryCuisines() {
    try {
      const { data, error } = await this.client.from('country_cuisines').select('*').order('country_name', { ascending: true }).returns<CountryCuisine[]>();
      if (error) {
        throw error;
      }

      return mergeCountryCuisines(data ?? [], FALLBACK_COUNTRY_CUISINES);
    } catch (error) {
      if (!isConnectivityError(error)) {
        console.warn('Falling back to bundled country cuisines.', error);
      }

      return [...FALLBACK_COUNTRY_CUISINES].sort(compareByName);
    }
  }

  async getRegionalFoods(countryCode?: string) {
    try {
      let query = this.client.from('regional_foods').select('*').order('name', { ascending: true });
      if (countryCode) {
        query = query.contains('country_codes', [countryCode.toUpperCase()]);
      }

      const { data, error } = await query.returns<RegionalFood[]>();
      if (error) {
        throw error;
      }

      return filterRegionalFoods(mergeRegionalFoods(data ?? [], FALLBACK_REGIONAL_FOODS), countryCode);
    } catch (error) {
      if (!isConnectivityError(error)) {
        console.warn('Falling back to bundled regional foods.', error);
      }

      return filterRegionalFoods(FALLBACK_REGIONAL_FOODS, countryCode).sort(compareByName);
    }
  }

  async getBodyMetricLogs(userId: string) {
    const { data, error } = await this.client
      .from('body_metric_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .returns<BodyMetricLog[]>();

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async saveBodyMetricLog(userId: string, input: Omit<BodyMetricLog, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.client
      .from('body_metric_logs')
      .upsert({
        user_id: userId,
        ...input,
      })
      .select('*')
      .single<BodyMetricLog>();

    if (error) {
      throw error;
    }

    return data;
  }

  async getWaterLogs(userId: string, logDate?: string) {
    let query = this.client.from('water_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false });
    if (logDate) {
      query = query.eq('log_date', logDate);
    }

    const { data, error } = await query.returns<WaterLog[]>();
    if (error) {
      throw error;
    }

    return data ?? [];
  }
}

const nutritionService = new NutritionService();

export default nutritionService;

