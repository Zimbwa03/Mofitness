import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { colors } from "../../theme";

interface MoSkeletonProps {
  borderRadius?: number;
  height: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  width: DimensionValue;
}

export function MoSkeleton({ borderRadius = 12, height, style, testID, width }: MoSkeletonProps) {
  return (
    <View style={[styles.base, { width, height, borderRadius }, style]} testID={testID}>
      <View style={styles.shimmer}>
        <LinearGradient
          colors={[colors.bg_surface, colors.bg_elevated, colors.bg_surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    backgroundColor: colors.bg_surface,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    width: 140,
    height: "100%",
  },
});
