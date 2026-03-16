import { Image, StyleSheet, View } from "react-native";

import { theme } from "../../theme";

type BrandLogoProps = {
  size?: number;
};

export function BrandLogo({ size = 108 }: BrandLogoProps) {
  return (
    <View style={styles.container}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="Mofitness logo"
        source={require("../../../assets/brand-logo.png")}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    alignItems: "flex-start",
  },
});
