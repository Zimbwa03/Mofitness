import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { Step0CoachSelectScreen } from "../screens/onboarding/Step0CoachSelectScreen";
import { Step1PersonalDetailsScreen } from "../screens/onboarding/Step1PersonalDetailsScreen";
import { Step10WearablesScreen } from "../screens/onboarding/Step10WearablesScreen";
import { Step2FitnessGoalsScreen } from "../screens/onboarding/Step2FitnessGoalsScreen";
import { Step3ExperienceActivityScreen } from "../screens/onboarding/Step3ExperienceActivityScreen";
import { Step4EquipmentScreen } from "../screens/onboarding/Step4EquipmentScreen";
import { Step5ScheduleScreen } from "../screens/onboarding/Step5ScheduleScreen";
import { Step6SportFocusScreen } from "../screens/onboarding/Step6SportFocusScreen";
import { Step7NutritionScreen } from "../screens/onboarding/Step7NutritionScreen";
import { Step8MedicalScreen } from "../screens/onboarding/Step8MedicalScreen";
import { Step9WellnessScreen } from "../screens/onboarding/Step9WellnessScreen";
import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        title: "Onboarding",
        headerBackVisible: false,
      }}
    >
      <Stack.Screen
        name="Step0CoachSelect"
        component={Step0CoachSelectScreen}
        options={{ title: "Choose Coach", headerShown: false }}
      />
      <Stack.Screen
        name="Step1PersonalDetails"
        component={Step1PersonalDetailsScreen}
        options={{ title: "Personal Details" }}
      />
      <Stack.Screen name="Step2FitnessGoals" component={Step2FitnessGoalsScreen} options={{ title: "Fitness Goals" }} />
      <Stack.Screen
        name="Step3ExperienceActivity"
        component={Step3ExperienceActivityScreen}
        options={{ title: "Experience & Activity" }}
      />
      <Stack.Screen name="Step4Equipment" component={Step4EquipmentScreen} options={{ title: "Equipment" }} />
      <Stack.Screen name="Step5Schedule" component={Step5ScheduleScreen} options={{ title: "Schedule" }} />
      <Stack.Screen name="Step6SportFocus" component={Step6SportFocusScreen} options={{ title: "Sport Focus" }} />
      <Stack.Screen name="Step7Nutrition" component={Step7NutritionScreen} options={{ title: "Nutrition" }} />
      <Stack.Screen name="Step8Medical" component={Step8MedicalScreen} options={{ title: "Medical" }} />
      <Stack.Screen name="Step9Wellness" component={Step9WellnessScreen} options={{ title: "Wellness" }} />
      <Stack.Screen name="Step10Wearables" component={Step10WearablesScreen} options={{ title: "Wearables" }} />
    </Stack.Navigator>
  );
}
