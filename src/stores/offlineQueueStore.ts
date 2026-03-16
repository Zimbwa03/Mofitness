import { create } from 'zustand';

interface OfflineQueueState {
  pendingCount: number;
  setPendingCount: (count: number) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>((set) => ({
  pendingCount: 0,
  setPendingCount: (pendingCount) => set({ pendingCount }),
}));
