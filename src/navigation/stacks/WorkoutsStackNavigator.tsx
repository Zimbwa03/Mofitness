import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { MoHeader } from "../../components/navigation/MoHeader";
import { MenuScreen } from "../../screens/profile/MenuScreen";
import { PrivacyPolicyScreen } from "../../screens/profile/PrivacyPolicyScreen";
import { ProfileScreen } from "../../screens/profile/ProfileScreen";
import { RewardsScreen } from "../../screens/profile/RewardsScreen";
import { SettingsScreen } from "../../screens/profile/SettingsScreen";
import { WearablesScreen } from "../../screens/profile/WearablesScreen";
import { WorkoutDetailScreen } from "../../screens/workouts/WorkoutDetailScreen";
import { WorkoutCompleteScreen } from "../../screens/workouts/WorkoutCompleteScreen";
import { WorkoutPlayerScreen } from "../../screens/workouts/WorkoutPlayerScreen";
import { WorkoutsScreen } from "../../screens/workouts/WorkoutsScreen";
import { theme } from "../../theme";
import type { WorkoutsStackParamList } from "../types";
import { AccountHeaderButton, MenuHeaderButton } from "./HeaderButtons";

const Stack = createNativeStackNavigator<WorkoutsStackParamList>();

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

export function WorkoutsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={baseScreenOptions}>
      <Stack.Screen
        name="WorkoutsHome"
        component={WorkoutsScreen}
        options={({ navigation }) => ({
          title: "Workouts",
          headerLeft: () => <MenuHeaderButton onPress={() => navigation.navigate("Menu")} />,
          headerRight: () => <AccountHeaderButton onPress={() => navigation.navigate("Profile")} />,
        })}
      />
      <Stack.Screen name="Menu" component={MenuScreen} options={{ title: "Menu" }} />
      <Stack.Screen
        name="WorkoutDetail"
        component={WorkoutDetailScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen
        name="WorkoutPlayer"
        component={WorkoutPlayerScreen}
        options={({ route }) => ({ title: route.params.title, headerShown: false })}
      />
      <Stack.Screen
        name="WorkoutComplete"
        component={WorkoutCompleteScreen}
        options={{ title: "Workout Complete", headerBackVisible: false }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Account Preferences" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="Wearables" component={WearablesScreen} options={{ title: "Wearables" }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: "Privacy & Security" }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: "Rewards" }} />
    </Stack.Navigator>
  );
}
