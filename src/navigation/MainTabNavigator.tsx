import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { MoTabBar } from "../components/navigation/MoTabBar";
import { theme } from "../theme";
import { ChallengesStackNavigator } from "./stacks/ChallengesStackNavigator";
import { DashboardStackNavigator } from "./stacks/DashboardStackNavigator";
import { FindCoachStackNavigator } from "./stacks/FindCoachStackNavigator";
import { NutritionStackNavigator } from "./stacks/NutritionStackNavigator";
import { WellnessStackNavigator } from "./stacks/WellnessStackNavigator";
import { WorkoutsStackNavigator } from "./stacks/WorkoutsStackNavigator";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const screenOptions = {
  headerStyle: {
    backgroundColor: theme.colors.surface,
  },
  headerTintColor: theme.colors.text,
  tabBarActiveTintColor: theme.colors.primary,
  tabBarInactiveTintColor: theme.colors.textMuted,
  tabBarStyle: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
  },
};

export function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={screenOptions} tabBar={(props) => <MoTabBar {...props} />}>
      <Tab.Screen
        name="Dashboard"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />
          ),
        }}
        component={DashboardStackNavigator}
      />
      <Tab.Screen
        name="Workouts"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dumbbell" color={color} size={size} />
          ),
        }}
        component={WorkoutsStackNavigator}
      />
      <Tab.Screen
        name="Challenges"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy-outline" color={color} size={size} />
          ),
        }}
        component={ChallengesStackNavigator}
      />
      <Tab.Screen
        name="Coaches"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group-outline" color={color} size={size} />
          ),
        }}
        component={FindCoachStackNavigator}
      />
      <Tab.Screen
        name="Nutrition"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="food-apple-outline" color={color} size={size} />
          ),
        }}
        component={NutritionStackNavigator}
      />
      <Tab.Screen
        name="Wellness"
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-pulse" color={color} size={size} />
          ),
        }}
        component={WellnessStackNavigator}
      />
    </Tab.Navigator>
  );
}
