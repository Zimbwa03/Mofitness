import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { MoHeader } from "../../components/navigation/MoHeader";
import { FindCoachScreen } from "../../screens/findCoach/FindCoachScreen";
import { CoachProfileScreen } from "../../screens/findCoach/CoachProfileScreen";
import { CoachChatScreen } from "../../screens/findCoach/CoachChatScreen";
import { MenuScreen } from "../../screens/profile/MenuScreen";
import { PrivacyPolicyScreen } from "../../screens/profile/PrivacyPolicyScreen";
import { ProfileScreen } from "../../screens/profile/ProfileScreen";
import { RewardsScreen } from "../../screens/profile/RewardsScreen";
import { SettingsScreen } from "../../screens/profile/SettingsScreen";
import { WearablesScreen } from "../../screens/profile/WearablesScreen";
import { theme } from "../../theme";
import type { FindCoachStackParamList } from "../types";
import { AccountHeaderButton, MenuHeaderButton } from "./HeaderButtons";

const Stack = createNativeStackNavigator<FindCoachStackParamList>();

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

export function FindCoachStackNavigator() {
  return (
    <Stack.Navigator screenOptions={baseScreenOptions}>
      <Stack.Screen
        name="FindCoachHome"
        component={FindCoachScreen}
        options={({ navigation }) => ({
          title: "Find Coach",
          headerLeft: () => <MenuHeaderButton onPress={() => navigation.navigate("Menu")} />,
          headerRight: () => <AccountHeaderButton onPress={() => navigation.navigate("Profile")} />,
        })}
      />
      <Stack.Screen name="CoachProfile" component={CoachProfileScreen} options={{ title: "Coach Profile" }} />
      <Stack.Screen name="CoachChat" component={CoachChatScreen} options={{ title: "Coach Chat" }} />
      <Stack.Screen name="Menu" component={MenuScreen} options={{ title: "Menu" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Account Preferences" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="Wearables" component={WearablesScreen} options={{ title: "Wearables" }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: "Privacy & Security" }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: "Rewards" }} />
    </Stack.Navigator>
  );
}
