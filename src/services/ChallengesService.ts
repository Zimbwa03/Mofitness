import type { AchievementBadge, RewardCatalogItem, UserBadge } from "../models";
import supabaseService from "./SupabaseService";

const fallbackRewards: RewardCatalogItem[] = [
  {
    id: "reward-1",
    title: "Gym Day Pass",
    description: "Redeem a partner gym access day.",
    points_cost: 500,
    active: true,
  },
  {
    id: "reward-2",
    title: "Nutrition Consult",
    description: "15 minute AI-assisted nutrition review.",
    points_cost: 900,
    active: true,
  },
];

const fallbackBadges: AchievementBadge[] = [
  {
    id: "badge-1",
    slug: "first-workout",
    title: "First Grind",
    description: "Completed your first logged workout.",
    icon_name: "flash",
    points_threshold: 10,
  },
  {
    id: "badge-2",
    slug: "streak-7",
    title: "Week Locked",
    description: "Hit a 7-day consistency streak.",
    icon_name: "trophy",
    points_threshold: 70,
  },
];

class ChallengesService {
  async getRewards() {
    try {
      return await supabaseService.fetchRewardCatalog();
    } catch {
      return fallbackRewards;
    }
  }

  async getBadges() {
    try {
      return await supabaseService.fetchAchievementBadges();
    } catch {
      return fallbackBadges;
    }
  }

  async getUserBadges(userId: string) {
    try {
      return await supabaseService.fetchUserBadges(userId);
    } catch {
      return [] as UserBadge[];
    }
  }
}

const challengesService = new ChallengesService();

export default challengesService;
