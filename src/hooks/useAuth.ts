import { useAuthStore } from "../stores/authStore";

export const useAuth = () => ({
  session: useAuthStore((state) => state.session),
  user: useAuthStore((state) => state.user),
  profile: useAuthStore((state) => state.profile),
  preferences: useAuthStore((state) => state.preferences),
  loading: useAuthStore((state) => state.loading),
  isOnboardingComplete: useAuthStore((state) => state.isOnboardingComplete),
  login: useAuthStore((state) => state.login),
  loginWithProvider: useAuthStore((state) => state.loginWithProvider),
  register: useAuthStore((state) => state.register),
  logout: useAuthStore((state) => state.logout),
  setProfile: useAuthStore((state) => state.setProfile),
  setPreferences: useAuthStore((state) => state.setPreferences),
  completeOnboarding: useAuthStore((state) => state.completeOnboarding),
});
