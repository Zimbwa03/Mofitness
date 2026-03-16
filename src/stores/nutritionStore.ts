import { create } from 'zustand';

import type {
  CountryCuisine,
  DailyMealPlan,
  FeedComment,
  FeedPost,
  MealAnalysisResult,
  MealLog,
  NutritionGoal,
  NutritionGoalDraft,
  RegionalFood,
  WaterLog,
} from '../models';
import { normalizeDailyMealPlan } from '../utils/nutrition';

interface NutritionState {
  activeGoal: NutritionGoal | null;
  goalDraft: NutritionGoalDraft | null;
  selectedDate: string;
  mealPlans: DailyMealPlan[];
  mealLogs: MealLog[];
  feedPosts: FeedPost[];
  feedComments: Record<string, FeedComment[]>;
  waterLogs: WaterLog[];
  countryCuisines: CountryCuisine[];
  regionalFoods: RegionalFood[];
  mealAnalysisDraft: MealAnalysisResult | null;
  loading: Record<string, boolean>;
  setActiveGoal: (goal: NutritionGoal | null) => void;
  setGoalDraft: (draft: NutritionGoalDraft | null) => void;
  setSelectedDate: (date: string) => void;
  setMealPlans: (mealPlans: DailyMealPlan[]) => void;
  upsertMealPlan: (mealPlan: DailyMealPlan) => void;
  setMealLogs: (mealLogs: MealLog[]) => void;
  upsertMealLog: (mealLog: MealLog) => void;
  setFeedPosts: (feedPosts: FeedPost[]) => void;
  upsertFeedPost: (post: FeedPost) => void;
  setFeedComments: (postId: string, comments: FeedComment[]) => void;
  setWaterLogs: (waterLogs: WaterLog[]) => void;
  addWaterLog: (waterLog: WaterLog) => void;
  setCountryCuisines: (rows: CountryCuisine[]) => void;
  setRegionalFoods: (rows: RegionalFood[]) => void;
  setMealAnalysisDraft: (draft: MealAnalysisResult | null) => void;
  setLoading: (key: string, value: boolean) => void;
  resetNutrition: () => void;
}

const initialSelectedDate = new Date().toISOString().slice(0, 10);

function upsertById<T extends { id: string }>(rows: T[], nextRow: T) {
  const existingIndex = rows.findIndex((row) => row.id === nextRow.id);
  if (existingIndex === -1) {
    return [nextRow, ...rows];
  }

  return rows.map((row, index) => (index === existingIndex ? nextRow : row));
}

function isDailyMealPlan(row: DailyMealPlan | null): row is DailyMealPlan {
  return row !== null;
}

export const useNutritionStore = create<NutritionState>((set) => ({
  activeGoal: null,
  goalDraft: null,
  selectedDate: initialSelectedDate,
  mealPlans: [],
  mealLogs: [],
  feedPosts: [],
  feedComments: {},
  waterLogs: [],
  countryCuisines: [],
  regionalFoods: [],
  mealAnalysisDraft: null,
  loading: {},
  setActiveGoal: (activeGoal) => set({ activeGoal }),
  setGoalDraft: (goalDraft) => set({ goalDraft }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setMealPlans: (mealPlans) => set({ mealPlans: mealPlans.map((mealPlan) => normalizeDailyMealPlan(mealPlan)).filter(isDailyMealPlan) }),
  upsertMealPlan: (mealPlan) =>
    set((state) => {
      const normalized = normalizeDailyMealPlan(mealPlan);
      if (!normalized) {
        return {};
      }

      return { mealPlans: upsertById(state.mealPlans, normalized) };
    }),
  setMealLogs: (mealLogs) => set({ mealLogs }),
  upsertMealLog: (mealLog) => set((state) => ({ mealLogs: upsertById(state.mealLogs, mealLog) })),
  setFeedPosts: (feedPosts) => set({ feedPosts }),
  upsertFeedPost: (post) => set((state) => ({ feedPosts: upsertById(state.feedPosts, post) })),
  setFeedComments: (postId, comments) =>
    set((state) => ({
      feedComments: {
        ...state.feedComments,
        [postId]: comments,
      },
    })),
  setWaterLogs: (waterLogs) => set({ waterLogs }),
  addWaterLog: (waterLog) => set((state) => ({ waterLogs: upsertById(state.waterLogs, waterLog) })),
  setCountryCuisines: (countryCuisines) => set({ countryCuisines }),
  setRegionalFoods: (regionalFoods) => set({ regionalFoods }),
  setMealAnalysisDraft: (mealAnalysisDraft) => set({ mealAnalysisDraft }),
  setLoading: (key, value) =>
    set((state) => ({
      loading: {
        ...state.loading,
        [key]: value,
      },
    })),
  resetNutrition: () =>
    set({
      activeGoal: null,
      goalDraft: null,
      selectedDate: initialSelectedDate,
      mealPlans: [],
      mealLogs: [],
      feedPosts: [],
      feedComments: {},
      waterLogs: [],
      countryCuisines: [],
      regionalFoods: [],
      mealAnalysisDraft: null,
      loading: {},
    }),
}));
