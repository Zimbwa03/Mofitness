import "react-native-gesture-handler";

import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  BebasNeue_400Regular,
} from "@expo-google-fonts/bebas-neue";
import {
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { useEffect } from "react";
import { Linking } from "react-native";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { PaperProvider } from "react-native-paper";

import { AppErrorBoundary } from "./src/components/common/AppErrorBoundary";
import "./src/i18n";
import { RootNavigator } from "./src/navigation/RootNavigator";
import challengesService from "./src/services/ChallengesService";
import notificationService from "./src/services/NotificationService";
import offlineSyncService from "./src/services/OfflineSyncService";
import coachAssetService from "./src/services/CoachAssetService";
import supabaseService from "./src/services/SupabaseService";
import { useAuthStore } from "./src/stores/authStore";
import { useChallengeStore } from "./src/stores/challengeStore";
import { useNutritionStore } from "./src/stores/nutritionStore";
import { useWorkoutStore } from "./src/stores/workoutStore";
import { navigationTheme, paperTheme, theme } from "./src/theme";
import { useState } from "react";

export default function App() {
  const [coachAssetsReady, setCoachAssetsReady] = useState(false);
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    DMSans_400Regular,
    DMSans_400Regular_Italic,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const syncSession = useAuthStore((state) => state.syncSession);
  const loading = useAuthStore((state) => state.loading);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setWorkouts = useWorkoutStore((state) => state.setWorkouts);
  const setMealPlans = useNutritionStore((state) => state.setMealPlans);
  const setRewards = useChallengeStore((state) => state.setRewards);
  const setBadges = useChallengeStore((state) => state.setBadges);
  const setUserBadges = useChallengeStore((state) => state.setUserBadges);

  useEffect(() => {
    coachAssetService
      .preloadAll()
      .then(() => setCoachAssetsReady(true))
      .catch(() => setCoachAssetsReady(true));
  }, []);

  useEffect(() => {
    hydrateSession().catch(() => undefined);

    const subscription = supabaseService.onAuthStateChange((_event, session) => {
      syncSession(session).catch(() => undefined);
    });

    return () => subscription.unsubscribe();
  }, [hydrateSession, syncSession]);

  useEffect(() => {
    const handleUrl = async (url: string) => {
      try {
        const session = await supabaseService.handleAuthCallback(url);
        if (session) {
          await syncSession(session);
        }
      } catch {
        return undefined;
      }
    };

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          return handleUrl(url);
        }
        return undefined;
      })
      .catch(() => undefined);

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url).catch(() => undefined);
    });

    return () => subscription.remove();
  }, [syncSession]);

  useEffect(() => {
    const hydrateOfflineData = async () => {
      const cachedWorkouts = await offlineSyncService.getCachedWorkouts();
      const cachedMealPlans = await offlineSyncService.getCachedMealPlans();
      setWorkouts(cachedWorkouts);
      setMealPlans(cachedMealPlans);
    };

    hydrateOfflineData().catch(() => undefined);
  }, [setMealPlans, setWorkouts]);

  useEffect(() => {
    if (!user) {
      setRewards([]);
      setBadges([]);
      setUserBadges([]);
      return;
    }

    const hydrateRewards = async () => {
      const [rewards, badges, userBadges] = await Promise.all([
        challengesService.getRewards(),
        challengesService.getBadges(),
        challengesService.getUserBadges(user.id),
      ]);

      setRewards(rewards);
      setBadges(badges);
      setUserBadges(userBadges);
    };

    hydrateRewards().catch(() => undefined);
  }, [setBadges, setRewards, setUserBadges, user]);

  useEffect(() => {
    if (!user || profile?.notifications_enabled === false) {
      return;
    }

    const syncNotifications = async () => {
      const pushToken = await notificationService.registerForPushNotifications(user.id);
      if (pushToken) {
        setProfile({ push_token: pushToken, notifications_enabled: true });
      }
      await notificationService.syncDefaultReminders(true);
    };

    syncNotifications().catch(() => undefined);
  }, [profile?.notifications_enabled, setProfile, user]);

  if (!fontsLoaded || loading || !coachAssetsReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={paperTheme}>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.background,
            }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </PaperProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <AppErrorBoundary>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </AppErrorBoundary>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
