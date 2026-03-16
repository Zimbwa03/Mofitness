import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { MoHeader } from "../../components/navigation/MoHeader";
import { ChallengesScreen } from "../../screens/challenges/ChallengesScreen";
import { LeaderboardScreen } from "../../screens/challenges/LeaderboardScreen";
import { MenuScreen } from "../../screens/profile/MenuScreen";
import { PrivacyPolicyScreen } from "../../screens/profile/PrivacyPolicyScreen";
import { ProfileScreen } from "../../screens/profile/ProfileScreen";
import { RewardsScreen } from "../../screens/profile/RewardsScreen";
import { SettingsScreen } from "../../screens/profile/SettingsScreen";
import { WearablesScreen } from "../../screens/profile/WearablesScreen";
import { theme } from "../../theme";
import type { ChallengesStackParamList } from "../types";
import { AccountHeaderButton, MenuHeaderButton } from "./HeaderButtons";

const Stack = createNativeStackNavigator<ChallengesStackParamList>();

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

export function ChallengesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={baseScreenOptions}>
      <Stack.Screen
        name="ChallengesHome"
        component={ChallengesScreen}
        options={({ navigation }) => ({
          title: "Challenges",
          headerLeft: () => <MenuHeaderButton onPress={() => navigation.navigate("Menu")} />,
          headerRight: () => <AccountHeaderButton onPress={() => navigation.navigate("Profile")} />,
        })}
      />
      <Stack.Screen name="Menu" component={MenuScreen} options={{ title: "Menu" }} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Account Preferences" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="Wearables" component={WearablesScreen} options={{ title: "Wearables" }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: "Privacy & Security" }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: "Rewards" }} />
    </Stack.Navigator>
  );
}
