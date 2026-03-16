import type { RoutePoint, RunActivityType, RunSummarySnapshot } from "../models";

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
};

export type OnboardingStackParamList = {
  Step0CoachSelect: undefined;
  Step1PersonalDetails: undefined;
  Step2FitnessGoals: undefined;
  Step3ExperienceActivity: undefined;
  Step4Equipment: undefined;
  Step5Schedule: undefined;
  Step6SportFocus: undefined;
  Step7Nutrition: undefined;
  Step8Medical: undefined;
  Step9Wellness: undefined;
  Step10Wearables: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Workouts: undefined;
  Challenges: undefined;
  Coaches: undefined;
  Nutrition: undefined;
  Wellness: undefined;
};

export type FindCoachStackParamList = {
  FindCoachHome: undefined;
  CoachProfile: { coachId: string };
  CoachChat: { coachId: string; conversationId?: string };
  Menu: undefined;
  Profile: undefined;
  Settings: undefined;
  Wearables: undefined;
  PrivacyPolicy: undefined;
  Rewards: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  RunDashboard: undefined;
  RunSetup:
    | {
        activityType: RunActivityType;
        plannedRoute?: RoutePoint[];
        plannedRouteName?: string | null;
      }
    | undefined;
  ActiveRun: { plannedRoute?: RoutePoint[] } | undefined;
  RouteDiscovery: { activityType?: RunActivityType } | undefined;
  IntervalRun: undefined;
  RunSummary: { summary: RunSummarySnapshot; routePoints: RoutePoint[] };
  RunHistory: undefined;
  FormCheckerSetup: undefined;
  FormCheckerLive: undefined;
  FormCheckerSummary: undefined;
  FormCheckerHistory: undefined;
  Menu: undefined;
  Profile: undefined;
  Settings: undefined;
  Wearables: undefined;
  PrivacyPolicy: undefined;
  Rewards: undefined;
};

export type WorkoutsStackParamList = {
  WorkoutsHome: undefined;
  Menu: undefined;
  WorkoutDetail: { workoutId: string; title: string };
  WorkoutPlayer: { workoutId: string; title: string };
  WorkoutComplete: {
    workoutId: string;
    title: string;
    durationSeconds: number;
    setsCompleted: number;
    calories: number;
    volumeKg: number;
  };
  Profile: undefined;
  Settings: undefined;
  Wearables: undefined;
  PrivacyPolicy: undefined;
  Rewards: undefined;
};

export type ChallengesStackParamList = {
  ChallengesHome: undefined;
  Menu: undefined;
  Leaderboard: undefined;
  Profile: undefined;
  Settings: undefined;
  Wearables: undefined;
  PrivacyPolicy: undefined;
  Rewards: undefined;
};

export type NutritionStackParamList = {
  NutritionHome: undefined;
  NutritionGoal: { fromOnboarding?: boolean } | undefined;
  MealPlanGenerator: { planDate?: string } | undefined;
  MealDetail: { planId: string; mealSlot: string };
  Menu: undefined;
  MealLog: { planId?: string; mealSlot?: string } | undefined;
  MealHistory: undefined;
  HealthFeed: undefined;
  HealthFeedPost: { mealLogId: string };
  HealthFeedDetail: { postId: string };
  FeedNotifications: undefined;
  Profile: undefined;
  Settings: undefined;
  Wearables: undefined;
  PrivacyPolicy: undefined;
  Rewards: undefined;
};

export type WellnessStackParamList = {
  WellnessHome: undefined;
  Menu: undefined;
  Profile: undefined;
  Settings: undefined;
  Wearables: undefined;
  PrivacyPolicy: undefined;
  Rewards: undefined;
};
