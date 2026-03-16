import type { StyleProp, ViewStyle } from "react-native";

export interface IconProps {
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export type TabIconName =
  | "home"
  | "workouts"
  | "challenges"
  | "nutrition"
  | "wellness"
  | "profile";
