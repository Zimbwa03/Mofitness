import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { MoHeader } from "../../components/navigation/MoHeader";
import { DashboardScreen } from "../../screens/dashboard/DashboardScreen";
import { FormCheckerHistoryScreen } from "../../features/formChecker/FormCheckerHistoryScreen";
import { FormCheckerScreen } from "../../features/formChecker/FormCheckerScreen";
import { FormCheckerSetupScreen } from "../../features/formChecker/FormCheckerSetupScreen";
import { FormCheckerSummaryScreen } from "../../features/formChecker/FormCheckerSummaryScreen";
import { ActiveRunScreen } from "../../screens/run/ActiveRunScreen";
import { IntervalRunScreen } from "../../screens/run/IntervalRunScreen";
import { RouteDiscoveryScreen } from "../../screens/run/RouteDiscoveryScreen";
import { RunDashboardScreen } from "../../screens/run/RunDashboardScreen";
import { RunHistoryScreen } from "../../screens/run/RunHistoryScreen";
import { RunSetupScreen } from "../../screens/run/RunSetupScreen";
import { RunSummaryScreen } from "../../screens/run/RunSummaryScreen";
import { MenuScreen } from "../../screens/profile/MenuScreen";
import { PrivacyPolicyScreen } from "../../screens/profile/PrivacyPolicyScreen";
import { ProfileScreen } from "../../screens/profile/ProfileScreen";
import { RewardsScreen } from "../../screens/profile/RewardsScreen";
import { SettingsScreen } from "../../screens/profile/SettingsScreen";
import { WearablesScreen } from "../../screens/profile/WearablesScreen";
import { theme } from "../../theme";
import type { DashboardStackParamList } from "../types";
import { AccountHeaderButton, MenuHeaderButton } from "./HeaderButtons";

const Stack = createNativeStackNavigator<DashboardStackParamList>();

const baseScreenOptions = {
  headerStyle: {
    backgroundColor: theme.colors.background,
  },
  headerTintColor: theme.colors.text,
  header: (props: Parameters<typeof MoHeader>[0]) => <MoHeader {...props} />,
  headerTitleStyle: {
    color: theme.colors.text,
    fontFamily: theme.typography.display,
  },
  contentStyle: {
    backgroundColor: theme.colors.background,
  },
};

export function DashboardStackNavigator() {
  return (
    <Stack.Navigator screenOptions={baseScreenOptions}>
      <Stack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={({ navigation }) => ({
          title: "Mofitness",
          headerLeft: () => <MenuHeaderButton onPress={() => navigation.navigate("Menu")} />,
          headerRight: () => <AccountHeaderButton onPress={() => navigation.navigate("Profile")} />,
        })}
      />
      <Stack.Screen name="RunDashboard" component={RunDashboardScreen} options={{ title: "Run & Track" }} />
      <Stack.Screen name="RunSetup" component={RunSetupScreen} options={{ title: "Set Your Target" }} />
      <Stack.Screen name="ActiveRun" component={ActiveRunScreen} options={{ title: "Active Run", headerShown: false }} />
      <Stack.Screen name="IntervalRun" component={IntervalRunScreen} options={{ title: "Interval Run" }} />
      <Stack.Screen name="RouteDiscovery" component={RouteDiscoveryScreen} options={{ title: "Find A Route" }} />
      <Stack.Screen name="RunSummary" component={RunSummaryScreen} options={{ title: "Run Summary", headerBackVisible: false }} />
      <Stack.Screen name="RunHistory" component={RunHistoryScreen} options={{ title: "Run History" }} />
      <Stack.Screen name="FormCheckerSetup" component={FormCheckerSetupScreen} options={{ title: "AI Form Checker" }} />
      <Stack.Screen name="FormCheckerLive" component={FormCheckerScreen} options={{ title: "Live Coach", headerShown: false }} />
      <Stack.Screen name="FormCheckerSummary" component={FormCheckerSummaryScreen} options={{ title: "Form Analysis", headerBackVisible: false }} />
      <Stack.Screen name="FormCheckerHistory" component={FormCheckerHistoryScreen} options={{ title: "Form History" }} />
      <Stack.Screen name="Menu" component={MenuScreen} options={{ title: "Menu" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Account Preferences" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="Wearables" component={WearablesScreen} options={{ title: "Wearables" }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: "Privacy & Security" }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: "Rewards" }} />
    </Stack.Navigator>
  );
}
