import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MoHeader } from '../../components/navigation/MoHeader';
import { FeedNotificationsScreen } from '../../screens/nutrition/FeedNotificationsScreen';
import { HealthFeedDetailScreen } from '../../screens/nutrition/HealthFeedDetailScreen';
import { HealthFeedPostScreen } from '../../screens/nutrition/HealthFeedPostScreen';
import { HealthFeedScreen } from '../../screens/nutrition/HealthFeedScreen';
import { MealDetailScreen } from '../../screens/nutrition/MealDetailScreen';
import { MealHistoryScreen } from '../../screens/nutrition/MealHistoryScreen';
import { MealLogScreen } from '../../screens/nutrition/MealLogScreen';
import { MealPlanGeneratorScreen } from '../../screens/nutrition/MealPlanGeneratorScreen';
import { NutritionGoalScreen } from '../../screens/nutrition/NutritionGoalScreen';
import { NutritionScreen } from '../../screens/nutrition/NutritionScreen';
import { MenuScreen } from '../../screens/profile/MenuScreen';
import { PrivacyPolicyScreen } from '../../screens/profile/PrivacyPolicyScreen';
import { ProfileScreen } from '../../screens/profile/ProfileScreen';
import { RewardsScreen } from '../../screens/profile/RewardsScreen';
import { SettingsScreen } from '../../screens/profile/SettingsScreen';
import { WearablesScreen } from '../../screens/profile/WearablesScreen';
import { theme } from '../../theme';
import type { NutritionStackParamList } from '../types';
import { AccountHeaderButton, MenuHeaderButton } from './HeaderButtons';

const Stack = createNativeStackNavigator<NutritionStackParamList>();

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

export function NutritionStackNavigator() {
  return (
    <Stack.Navigator screenOptions={baseScreenOptions}>
      <Stack.Screen
        name="NutritionHome"
        component={NutritionScreen}
        options={({ navigation }) => ({
          title: 'Nutrition',
          headerLeft: () => <MenuHeaderButton onPress={() => navigation.navigate('Menu')} />,
          headerRight: () => <AccountHeaderButton onPress={() => navigation.navigate('Profile')} />,
        })}
      />
      <Stack.Screen name="NutritionGoal" component={NutritionGoalScreen} options={{ title: 'Nutrition Goal' }} />
      <Stack.Screen name="MealPlanGenerator" component={MealPlanGeneratorScreen} options={{ title: 'Meal Plan Generator' }} />
      <Stack.Screen name="MealDetail" component={MealDetailScreen} options={{ title: 'Meal Detail' }} />
      <Stack.Screen name="MealLog" component={MealLogScreen} options={{ title: 'Log Meal' }} />
      <Stack.Screen name="MealHistory" component={MealHistoryScreen} options={{ title: 'Nutrition History' }} />
      <Stack.Screen name="HealthFeed" component={HealthFeedScreen} options={{ title: 'Health Feed' }} />
      <Stack.Screen name="HealthFeedPost" component={HealthFeedPostScreen} options={{ title: 'Share Meal' }} />
      <Stack.Screen name="HealthFeedDetail" component={HealthFeedDetailScreen} options={{ title: 'Meal Post' }} />
      <Stack.Screen name="FeedNotifications" component={FeedNotificationsScreen} options={{ title: 'Feed Notifications' }} />
      <Stack.Screen name="Menu" component={MenuScreen} options={{ title: 'Menu' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Account Preferences' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Wearables" component={WearablesScreen} options={{ title: 'Wearables' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy & Security' }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: 'Rewards' }} />
    </Stack.Navigator>
  );
}
