import { create } from "zustand";

import type { AchievementBadge, ChallengeSummary, RewardCatalogItem, UserBadge } from "../models";

interface ChallengeState {
  challenges: ChallengeSummary[];
  badges: AchievementBadge[];
  userBadges: UserBadge[];
  rewards: RewardCatalogItem[];
  setChallenges: (challenges: ChallengeSummary[]) => void;
  setBadges: (badges: AchievementBadge[]) => void;
  setRewards: (rewards: RewardCatalogItem[]) => void;
  setUserBadges: (userBadges: UserBadge[]) => void;
}

export const useChallengeStore = create<ChallengeState>((set) => ({
  challenges: [],
  badges: [],
  userBadges: [],
  rewards: [],
  setChallenges: (challenges) => set({ challenges }),
  setBadges: (badges) => set({ badges }),
  setRewards: (rewards) => set({ rewards }),
  setUserBadges: (userBadges) => set({ userBadges }),
}));
