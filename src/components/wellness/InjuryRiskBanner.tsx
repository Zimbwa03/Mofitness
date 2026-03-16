import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { theme } from "../../theme";

interface InjuryRiskBannerProps {
  visible: boolean;
}

export function InjuryRiskBanner({ visible }: InjuryRiskBannerProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text variant="titleMedium" style={styles.title}>
        Elevated injury risk
      </Text>
      <Text variant="bodyMedium" style={styles.body}>
        Recent strain and recovery trends suggest you should downshift intensity before the next hard session.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FDECEC",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.danger,
    marginBottom: theme.spacing.xs,
  },
  body: {
    color: theme.colors.text,
  },
});
