import { AuthNavigator } from "./AuthNavigator";
import { MainTabNavigator } from "./MainTabNavigator";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { useAuthStore } from "../stores/authStore";

export function RootNavigator() {
  const user = useAuthStore((state) => state.user);
  const isOnboardingComplete = useAuthStore((state) => state.isOnboardingComplete);

  if (!user) {
    return <AuthNavigator />;
  }

  if (!isOnboardingComplete) {
    return <OnboardingNavigator />;
  }

  return <MainTabNavigator />;
}
